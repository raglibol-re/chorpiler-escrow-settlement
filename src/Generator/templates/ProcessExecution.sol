//SPDX-License-Identifier: MIT

import "./EscrowSettlement.sol";

pragma solidity ^0.8.9;

contract {{{modelID}}} {
  event EscrowCreated(address indexed escrow);

  EscrowSettlement public escrow;

  function createEscrow(address payee) public payable {
    require(msg.value > 0, "amount required");
    escrow = new EscrowSettlement{ value: msg.value }(msg.sender, payee, msg.value);
    emit EscrowCreated(address(escrow));
  }

  // Rendering of Payment task
  {{#paymentTasks}}
  if (id == {{{taskId}}}) {
    // payer must call enact (or enforce)
    require(msg.sender == participants[{{{payerIndex}}}], "only payer");
    // amount must be in wei; use encoding to provide numeric literal or variable
    createEscrow{ value: {{{amount}}} }(participants[{{{payeeIndex}}}]);
  }
  {{/paymentTasks}}

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

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
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