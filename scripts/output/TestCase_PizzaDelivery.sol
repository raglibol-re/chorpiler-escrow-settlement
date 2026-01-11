//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ProcessExecution {
  uint public tokenState = 1;
  address[3] public participants;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(true) {
        if (msg.sender == participants[0] && 0 == id && (_tokenState & 1 == 1)) {
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          break;
        }
        if (msg.sender == participants[1] && 1 == id && (_tokenState & 2 == 2)) {
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          break;
        }
        if (msg.sender == participants[2] && 2 == id && (_tokenState & 4 == 4)) {
          _tokenState &= ~uint(4);
          _tokenState |= 0;
          break;
        }
      return;
    }


    tokenState = _tokenState;
  }
}