//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


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
}

contract ProcessExecution {
  uint public tokenState = 1;
  address constant TOKEN_ADDR = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // USDC mainnet
  uint256 constant AMOUNT = 15000000; // 15 USDC (6 decimals)
  PizzaEscrow public escrow;
  address[3] public participants;

  constructor(address[3] memory _participants) {
    participants = _participants;

    // Deploy escrow immediately so address is known for approval
    escrow = new PizzaEscrow(
      participants[0], // payer (Customer)
      participants[1], // payee (Pizza Place)
      address(this)    // processContract
    );
  }

  function enact(uint id, uint cond) external {
    uint _tokenState = tokenState;

    while(true) {
        if (msg.sender == participants[0] && id == 0 && ((_tokenState & 1) == 1)) {
          escrow.lock();
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          break;
        }
        if (msg.sender == participants[1] && id == 1 && ((_tokenState & 2) == 2)) {
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          break;
        }
        if (msg.sender == participants[2] && id == 2 && ((_tokenState & 4) == 4)) {
          _tokenState &= ~uint(4);
          _tokenState |= 8;
          break;
        }
        if (((cond & 1) == 1) && msg.sender == participants[0] && id == 3 && ((_tokenState & 8) == 8)) {
          escrow.refund();
          _tokenState &= ~uint(8);
          _tokenState |= 16;
          break;
        }
        if (((cond & 2) == 2) && msg.sender == participants[0] && id == 4 && ((_tokenState & 8) == 8)) {
          escrow.release();
          _tokenState &= ~uint(8);
          _tokenState |= 32;
          break;
        }
      revert("no enabled task");
    }

    while(_tokenState != 0) {
      if ((_tokenState & 48) != 0) {
        _tokenState &= ~uint(48);
        _tokenState |= 0;
        break; // is end
      }
      break;
    }

    tokenState = _tokenState;
  }
}