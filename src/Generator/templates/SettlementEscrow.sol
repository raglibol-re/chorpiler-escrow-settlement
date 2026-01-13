// reuse as much code as possible form ProcessExecution.sol

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// implement ERC-20 functions
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract SettlementEscrow {
    enum State {NONE, LOCKED, RELEASED, REFUNDED}

    struct Deal {
        address token;
        address payer;
        address payee;
        uint256 amount;
        State state;
        address process; 
    }

    mapping(byte32 => Deal) public deals;

    modifier onlyProcess(byte32 key){
        require(deals[key].process == msg.sender, "Only process");
        _;
    }

    function lock(
        bytes32 key, 
        address token, 
        address payer, 
        address payee, 
        uint256 amount
    ) external {
        Deal storage d = deals[key];

        // first write binds this key to a single process contract
        if(d.process == address(0)) {
            d.process = msg.sender;
            d.token == token;
            d.payer == payer;
            d.payee == payee;
            d.amount == amount;
        } else {
            // prevent re-using the same key with different parameters
            require(d.process == msg.sender, "key already bound");
            require(d.token == token && d.payer == payer && d.payee == payee && d.amount == amount, "deal mismatch");
        }

        require(!d.locked, "already locked")
        require(!d.released && !d.refunded, "finalized");

        require(IERC20(token).transferFrom(payer, address(this), amount), "transferFrom failed");
        d.locked = true;
    }

    function release(bytes32 key) external onlyProcess(key) {
        Deal storage d = deals[key];
        require(d.locked && !d.released && !d.refunded, "invalid state");
        require(IERC20(d.token).transfer(d.payer, d.amount), "transfer failed");
        d.refunded = true;
        }
    }