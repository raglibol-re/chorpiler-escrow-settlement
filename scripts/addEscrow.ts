// scripts/addEscrowComplete.ts - ENTHÄLT JETZT ALLE ESCROW LOGIK
import * as fs from 'fs';
import * as path from 'path';

function addEscrowToContract(contractPath: string): string {
  let contract = fs.readFileSync(contractPath, 'utf8');
  
  // 1. Add escrow contract and interface
  const escrowCode = `
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract PizzaEscrow {
    address public payer;
    address public payee;
    IERC20 public token;
    uint256 public amount;
    bool public locked;
    bool public released;
    bool public refunded;
    address public processContract;
    
    constructor(address _payer, address _payee, address _processContract) {
        payer = _payer;
        payee = _payee;
        // TODO: Für Testnets andere Token-Adressen verwenden!
        token = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); // USDC Mainnet
        amount = 15000000; // 15 USDC
        processContract = _processContract;
    }

    modifier onlyProcess() {
        require(msg.sender == processContract, "Only process contract");
        _;
    }
    
    function lock() external onlyProcess {
        require(!locked, "Already locked");
        require(token.transferFrom(payer, address(this), amount), "Transfer failed");
        locked = true;
    }
    
    function release() external onlyProcess {
        require(locked && !released && !refunded, "Invalid state");
        require(token.transfer(payee, amount), "Transfer failed");
        released = true;
    }
    
    function refund() external onlyProcess {
        require(locked && !released && !refunded, "Invalid state");
        require(token.transfer(payer, amount), "Transfer failed");
        refunded = true;
    }
}`;
  
  // Insert escrow code
  contract = contract.replace(
    'pragma solidity ^0.8.9;\n\n',
    'pragma solidity ^0.8.9;\n\n' + escrowCode + '\n\n'
  );
  
  // 2. Add escrow state variable and constants
  contract = contract.replace(
    /(contract \w+ \{\s*\n\s*uint public tokenState = 1;)/,
    `$1
  address constant TOKEN_ADDR = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // USDC mainnet
  uint256 constant AMOUNT = 15000000; // 15 USDC (6 decimals)
  PizzaEscrow public escrow;`
  );
  
  // 3. Deploy escrow in constructor
  const oldConstructor = `  constructor(address[3] memory _participants) {
    participants = _participants;
  }`;
  
  const newConstructor = `  constructor(address[3] memory _participants) {
    participants = _participants;

    // Deploy escrow immediately so address is known for approval
    escrow = new PizzaEscrow(
      participants[0], // payer (Customer)
      participants[1], // payee (Pizza Place)
      address(this)    // processContract
    );
  }`;
  
  contract = contract.replace(oldConstructor, newConstructor);
  
  // 4. Add approveEscrow function (from template)
  contract = contract.replace(
    /(function enact\(uint id\) external \{\s*{{> execution}}\s*\}\s*)/,
    `$1

  // Approve escrow function
  function approveEscrow() external {
    require(msg.sender == participants[0], "Only customer can approve");
    IERC20(TOKEN_ADDR).approve(address(this), AMOUNT);
  }`
  );
  
  // 5. Fix ALL bitmask conditions - CRITICAL SOLIDITY BUG FIX!
  contract = contract.replace(
    /if \(msg\.sender == participants\[0\] && 0 == id && \(_tokenState & 1 == 1\)\) \{/,
    `if (msg.sender == participants[0] && id == 0 && ((_tokenState & 1) == 1)) {`
  );
  
  contract = contract.replace(
    /if \(msg\.sender == participants\[1\] && 1 == id && \(_tokenState & 2 == 2\)\) \{/,
    `if (msg.sender == participants[1] && id == 1 && ((_tokenState & 2) == 2)) {`
  );
  
  contract = contract.replace(
    /if \(msg\.sender == participants\[2\] && 2 == id && \(_tokenState & 4 == 4\)\) \{/,
    `if (msg.sender == participants[2] && id == 2 && ((_tokenState & 4) == 4)) {`
  );
  
  contract = contract.replace(
    /if \(\(cond & 1 == 1\) && msg\.sender == participants\[0\] && 3 == id && \(_tokenState & 8 == 8\)\) \{/,
    `if (((cond & 1) == 1) && msg.sender == participants[0] && id == 3 && ((_tokenState & 8) == 8)) {`
  );
  
  contract = contract.replace(
    /if \(\(cond & 2 == 2\) && msg\.sender == participants\[0\] && 4 == id && \(_tokenState & 8 == 8\)\) \{/,
    `if (((cond & 2) == 2) && msg.sender == participants[0] && id == 4 && ((_tokenState & 8) == 8)) {`
  );
  
  // 6. Add escrow calls to the corrected conditions
  contract = contract.replace(
    /if \(msg\.sender == participants\[0\] && id == 0 && \(\(_tokenState & 1\) == 1\)\) \{\s*_tokenState &= ~uint\(1\);\s*_tokenState \|= 2;\s*break;\s*\}/,
    `if (msg.sender == participants[0] && id == 0 && ((_tokenState & 1) == 1)) {
          escrow.lock();
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          break;
        }`
  );
  
  contract = contract.replace(
    /if \(\(\(cond & 1\) == 1\) && msg\.sender == participants\[0\] && id == 3 && \(\(_tokenState & 8\) == 8\)\) \{\s*_tokenState &= ~uint\(8\);\s*_tokenState \|= 16;\s*break;\s*\}/,
    `if (((cond & 1) == 1) && msg.sender == participants[0] && id == 3 && ((_tokenState & 8) == 8)) {
          escrow.refund();
          _tokenState &= ~uint(8);
          _tokenState |= 16;
          break;
        }`
  );
  
  contract = contract.replace(
    /if \(\(\(cond & 2\) == 2\) && msg\.sender == participants\[0\] && id == 4 && \(\(_tokenState & 8\) == 8\)\) \{\s*_tokenState &= ~uint\(8\);\s*_tokenState \|= 32;\s*break;\s*\}/,
    `if (((cond & 2) == 2) && msg.sender == participants[0] && id == 4 && ((_tokenState & 8) == 8)) {
          escrow.release();
          _tokenState &= ~uint(8);
          _tokenState |= 32;
          break;
        }`
  );
  
  // 7. Fix end condition
  contract = contract.replace(
    /if\s*\(\s*\(_tokenState\s*&\s*48\s*==\s*48\)\s*\)/,
    'if ((_tokenState & 48) != 0)'
  );
  
  // 8. Better error handling
  contract = contract.replace(
    '      return;',
    '      revert("no enabled task");'
  );
  
  return contract;
}

// Auto-process latest contract
const outputDir = path.join(__dirname, 'output');

const files = fs.readdirSync(outputDir)
  .filter(f => f.endsWith('.sol') && !f.includes('_withEscrow'))
  .sort((a, b) => {
    const statA = fs.statSync(path.join(outputDir, a));
    const statB = fs.statSync(path.join(outputDir, b));
    return statB.mtime.getTime() - statA.mtime.getTime();
  });

if (files.length === 0) {
  console.error('❌ No contract files found');
  process.exit(1);
}

const latestContract = path.join(outputDir, files[0]);
console.log(`🔍 Processing: ${latestContract}`);

const enhancedContract = addEscrowToContract(latestContract);
const outputPath = latestContract.replace('.sol', '_withEscrow.sol');

fs.writeFileSync(outputPath, enhancedContract);
console.log(`✅ Enhanced contract saved to: ${outputPath}`);
console.log(`💡 Customer must approve escrow: token.approve(processContract.escrow(), 15000000)`);
console.log(`⚠️  For testnets: Update TOKEN_ADDR in the contract!`);