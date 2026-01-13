// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ({{#conditions}}{{> condition}}{{/conditions}}) {
{{/hasConditions}}

{{#taskName}}
// <--- custom code for task here --->
_tokenState &= ~uint({{{consume}}});
{{/taskName}}


{{#settlement}}

{{#lock}}
escrow.lock(
    {{{key}}},
    {{{token}}}, 
    {{{payer}}}, 
    {{{payee}}},
    {{{amount}}}
);
{{/lock}}

{{#release}}
escrow.release({{{key}}});
{{/release}}

{{#refund}}
escrow.refund({{{key}}});
{{/refund}}

{{/settlement}}


_tokenState &= ~uint({{{consume}}});
{{#outTo}}
tokenState[{{outTo.id}}] = {{outTo.produce}};
{{/outTo}}
{{#produce}}
_tokenState |= {{{produce}}};
{{/produce}}
{{#isEnd}}
break; // is end
{{/isEnd}}
{{^isEnd}}
{{#initiator}}
{{#loopProtection}}
id = 0;
{{/loopProtection}}
{{/initiator}}
continue; 
{{/isEnd}}

{{#hasConditions}}
}
{{/hasConditions}}