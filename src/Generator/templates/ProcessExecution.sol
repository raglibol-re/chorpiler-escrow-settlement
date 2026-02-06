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

function createERC20Escrow(address payee, address tokenAddress, uint256 amount) public {
  require(amount > 0, "amount required");
  escrow = new EscrowSettlement(msg.sender, payee, tokenAddress, amount, 0, EscrowSettlement.TokenType.ERC20);
  emit EscrowCreated(address(escrow));
}

function createERC721Escrow(address payee, address tokenAddress, uint256 tokenId) public {
  escrow = new EscrowSettlement(msg.sender, payee, tokenAddress, 0, tokenId, EscrowSettlement.TokenType.ERC721);
  emit EscrowCreated(address(escrow));
}

 // Rendering of Payment task
{{#paymentTasks}}
if (id == {{{taskId}}}) {
  // payer must call enact (or enforce)
  require(msg.sender == participants[{{{payerIndex}}}], "only payer");
  
  {{#isNative}}
  // Native ETH payment
  createEscrow{ value: {{{amount}}} }(participants[{{{payeeIndex}}}]);
  {{/isNative}}
  
  {{#isERC20}}
  // ERC-20 token payment
  createERC20Escrow(participants[{{{payeeIndex}}}], {{{tokenAddress}}}, {{{amount}}});
  {{/isERC20}}
  
  {{#isERC721}}
  // ERC-721 NFT payment
  createERC721Escrow(participants[{{{payeeIndex}}}], {{{tokenAddress}}}, {{{tokenId}}});
  {{/isERC721}}
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