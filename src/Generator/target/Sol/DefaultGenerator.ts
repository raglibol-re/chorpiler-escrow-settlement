import { InteractionNet } from "../../../Parser/InteractionNet"
import { CaseVariable } from "../../Encoding/Encoding";
import { TemplateEngine } from "../../TemplateEngine"
import path from "path";

//RE: Changes
import fs from "fs";
import { ProcessEncoding } from "chorpiler/lib/Generator/ProcessEncoding";


export default class SolDefaultContractGenerator extends TemplateEngine {

  constructor(
    _iNet: InteractionNet, 
    _caseVariables?: Map<string, CaseVariable>) {
    super(_iNet, 
      path.join(__dirname, '..', '..', 'templates/ProcessExecution.sol'), 
      _caseVariables,
    [ { partial: 'transition', path: path.join(__dirname, '..', '..', 'templates/partials/transition.mustache.sol') },
      { partial: 'condition', path: path.join(__dirname, '..', '..', 'templates/partials/condition.mustache.sol') },
      { partial: 'execution', path: path.join(__dirname, '..', '..', 'templates/partials/execution.mustache.sol') },
    ]);
  }

  //RE: Add method to compile EscrowSettlement.sol
   async compile(unfoldSubNets = false, loopProtection = true) {
    const escrowTemplate = path.join(__dirname, '..', '..', 'templates', 'EscrowSettlement.sol');
    const result = await super.compile(unfoldSubNets, loopProtection, [{ name: 'escrow', path: escrowTemplate }]);
    return result;
  }

  writeOutputs(outDir: string, base: string, result: { target: string; encoding: any; extras?: Record<string, string> }) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${base}.sol`), result.target, { flag: 'w+' });
    if (result.encoding) {
      fs.writeFileSync(path.join(outDir, `${base}_encoding.json`), JSON.stringify(result.encoding, null, 2), { flag: 'w+' });
    }
    if (result.extras?.escrow) {
      fs.writeFileSync(path.join(outDir, `${base}.escrow.sol`), result.extras.escrow, { flag: 'w+' });
    }
  }
}