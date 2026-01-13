//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//RE: import interface 

interface ISettlementEscrow { 
  function lock(bytes32 key, address token, address payer, address payee, uint256 amount) external;
  function release(bytes32 key) external;
  function refund(bytes32 key) external;
}

contract {{{modelID}}} {
  {{^hasSubProcesses}}
  uint public tokenState = 1;
  {{/hasSubProcesses}}
  {{#hasSubProcesses}}
  uint[{{{numberOfProcesses}}}] public tokenState;
  {{/hasSubProcesses}}
  address[{{{numberOfParticipants}}}] public participants;
  {{#caseVariables}}
  {{{expression}}}
  {{/caseVariables}}
  //RE: implement interface
  ISettlementEscrow public escrow;

  //RE: add escrow address to constructor
  constructor(address[{{{numberOfParticipants}}}] memory _participants, address escrow) {
    participants = _participants;
    escrow = ISettlementEscrow(_escrow);
  }
  {{#caseVariables}}
  {{#setters}}
  function {{{functionName}}}({{{type}}} _{{{name}}}) external {
    {{{name}}} = _{{{name}}};
  }
  {{/setters}}
  {{/caseVariables}}

  function enact(uint id) external {
    {{> execution}}
  }

  {{#subProcesses}}
  function {{modelID}}(uint id) external {
    {{> execution}}
  }
  {{/subProcesses}}
}