// scripts/addEscrow.ts - Simple escrow integration
import * as fs from 'fs';

const ESCROW_CODE = `
pragma solidity ^0.8.0;

contract EscrowSettlement {
    address public payer;
    address public payee;
    uint256 public amount;
    bool public released;

    constructor(address _payer, address _payee, uint256 _amount) payable {
        payer = _payer;
        payee = _payee;
        amount = _amount;
        released = false;
    }

    function release() external {
        require(msg.sender == payer, "only payer can release");
        released = true;
    }

    function withdraw() external {
        require(released, "not released");
        require(msg.sender == payee, "only payee");
        uint v = amount;
        amount = 0;
        payable(payee).transfer(v);
    }
}
`;

function addEscrow(contractPath: string) {
  let contract = fs.readFileSync(contractPath, 'utf8');
  
  // Add escrow contract before main contract
  contract = contract.replace(
    /pragma solidity \^\d+\.\d+\.\d+;\s*\n\s*\n/,
    (match) => match + ESCROW_CODE + '\n\n'
  );
  
  // Add escrow state variable
  contract = contract.replace(
    /(contract \w+ \{\s*\n\s*uint public tokenState = 1;)/,
    '$1\n  EscrowSettlement public escrow;'
  );
  
  // Add escrow creation method
  contract = contract.replace(
    /(constructor\([^}]+\{\s*\n\s*participants = _participants;\s*\n\s*\}\))/,
    '$1\n\n  function createEscrow(address payee) public payable {\n    escrow = new EscrowSettlement{value: msg.value}(msg.sender, payee, msg.value);\n  }'
  );
  
  // Make enact payable
  contract = contract.replace(
    'function enact(uint id) external',
    'function enact(uint id) external payable'
  );
  
  return contract;
}

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: npx ts-node scripts/addEscrow.ts <contract.sol>');
  process.exit(1);
}

const enhancedContract = addEscrow(inputFile);
const outputPath = inputFile.replace('.sol', '_withEscrow.sol');
fs.writeFileSync(outputPath, enhancedContract);

console.log(`✅ Enhanced contract saved to: ${outputPath}`);