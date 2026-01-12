//use example code from README.md to test chorpiler with example bpmn code
//run npm install chorpiler


// ...existing code...
import * as fs from 'fs';
import path from 'path';
import { INetFastXMLParser } from '../src/Parser/FastXMLParser';
import SolDefaultContractGenerator from '../src/Generator/target/Sol/DefaultGenerator';


(async () => {
  const bpmnPath = process.argv[2];
  if (!bpmnPath) {
    console.error('Usage: npx ts-node scripts/generatewithescrow.ts <file.bpmn>');
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(bpmnPath) ? bpmnPath : path.resolve(process.cwd(), bpmnPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error('File not found:', resolvedPath);
    process.exit(1);
  }

  try {
    const xml = fs.readFileSync(resolvedPath);
    const parser = new INetFastXMLParser();
    const iNetArray = await parser.fromXML(xml);
    console.log('Parsed nets:', Array.isArray(iNetArray) ? iNetArray.length : 'single');

    const iNet = Array.isArray(iNetArray) ? iNetArray[0] : iNetArray;
    const generator = new SolDefaultContractGenerator(iNet);

    const result = await generator.compile();
    if (!result || !result.target) {
      console.error('Generation failed: generator returned no result.');
      process.exit(1);
    }

    const outDir = path.resolve(__dirname, 'output');
    fs.mkdirSync(outDir, { recursive: true });

    const base = path.basename(resolvedPath, path.extname(resolvedPath));
    const outSol = path.join(outDir, `${base}.sol`);
    const outJson = path.join(outDir, `${base}_encoding.json`);

    fs.writeFileSync(outSol, result.target, { flag: 'w+' });
    console.log(`Wrote ${outSol}`);

    if (result.encoding) {
      // write raw encoding (or transform with proper helper if available)
      fs.writeFileSync(outJson, JSON.stringify(result.encoding, null, 2), { flag: 'w+' });
      console.log(`Wrote ${outJson}`);
    } else {
      console.log('No encoding returned; skipping JSON output.');
    }

    if (result.extras?.escrow) {
      const outEscrow = path.join(outDir, `${base}.escrow.sol`);
      fs.writeFileSync(outEscrow, result.extras.escrow, { flag: 'w+' });
      console.log(`Wrote ${outEscrow}`);
    } else {
      console.log('No escrow template rendered (no extras.escrow).');
    }
  } catch (err) {
    console.error('Generation failed:', err);
    process.exit(1);
  }
})();