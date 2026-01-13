//use example code from README.md to test chorpiler with example bpmn code
//run npm install chorpiler


import * as fs from 'fs';
import * as path from 'path';
import { TriggerEncoding } from '../../src/Generator/Encoding/TriggerEncoding';
import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultGenerator";
import { INetFastXMLParser } from '../../src/Parser/FastXMLParser';

(async () => {
  const bpmnPath = process.argv[2];
  if (!bpmnPath) {
    console.error('Usage: npx ts-node scripts/script-solution/generate.ts <bpmn-file>');
    process.exit(1);
  }

  try {
    // 1) Read BPMN
    const bpmnXML = fs.readFileSync(path.resolve(bpmnPath));

    // 2) Parse BPMN → Interaction Net
    const parser = new INetFastXMLParser;
    const iNet = await parser.fromXML(bpmnXML);
    const processNet = Array.isArray(iNet) ? iNet[0] : iNet;

    // 3) Create generator with processNet
    const generator = new SolDefaultContractGenerator(processNet);

    // 4) Compile
    const result = await generator.compile();

    // 5) Prepare output paths
    const outDir = path.resolve(__dirname, 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.basename(bpmnPath, path.extname(bpmnPath));
    const outSol = path.join(outDir, `${base}.sol`);
    const outJson = path.join(outDir, `${base}_encoding.json`);

    // 6) Write process contract
    fs.writeFileSync(outSol, result.target, { flag: 'w+' });

    // 7) Copy escrow template
    const escrowTemplate = path.resolve(__dirname, '..', '..', '..', 'src', 'Generator', 'templates', 'SettlementEscrow.sol');
    if (fs.existsSync(escrowTemplate)) {
      const outEscrow = path.join(outDir, 'SettlementEscrow.sol');
      fs.copyFileSync(escrowTemplate, outEscrow);
      console.log(`Wrote ${outEscrow}`);
    } else {
      console.warn(`Escrow template not found at: ${escrowTemplate}`);
    }

    // 8) Write encoding
    if (result.encoding) {
      const encoded = JSON.stringify(TriggerEncoding.toJSON(result.encoding), null, 2);
      fs.writeFileSync(outJson, encoded, { flag: 'w+' });
      console.log(`Wrote ${outJson}`);
    } else {
      console.warn('No encoding generated.');
    }

    console.log(`Wrote ${outSol}`);
    console.log('Done.');
  } catch (err) {
    console.error('Generation failed:', err);
    process.exit(1);
  }
})();