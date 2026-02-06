// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract EscrowSettlement {
    enum TokenType { NATIVE, ERC20, ERC721 }
    
    TokenType public tokenType;
    address public tokenAddress;
    address public payer;
    address public payee;
    uint256 public amount;
    uint256 public tokenId; // for ERC721
    bool public released;


constructor(address _payer, address _payee, uint256 _amount) payable {
  tokenType = TokenType.NATIVE;
  payer = _payer;
  payee = _payee;
  amount = _amount;
  released = false;
}

constructor(address _payer, address _payee, address _tokenAddress, uint256 _amount, uint256 _tokenId, TokenType _tokenType) {
  tokenType = _tokenType;
  tokenAddress = _tokenAddress;
  payer = _payer;
  payee = _payee;
  amount = _amount;
  tokenId = _tokenId;
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