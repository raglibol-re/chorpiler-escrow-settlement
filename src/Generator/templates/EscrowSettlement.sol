pragma solidity ^0.8.0;

/// EscrowSettlement generated for process
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