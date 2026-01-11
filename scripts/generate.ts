//use example code from README.md to test chorpiler with example bpmn code
//run npm install chorpiler


import * as fs from 'fs';
import chorpiler, { ProcessEncoding } from 'chorpiler';
import * as path from 'path';

//test
import INetFastXMLParser from 'chorpiler';
import SolDefaultContractGenerator from 'chorpiler';

(async () => {
  const bpmnPath = process.argv[2];
  if (!bpmnPath) {
    console.error('Usage: npx ts-node scripts/generate.ts scripts\TestCase_PizzaDelivery.bpmn');
    process.exit(1);
  }

try {
//RE: Extra step to read file, because of compiler issue
const xml = fs.readFileSync(path.resolve(bpmnPath));
const parser = new chorpiler.Parser();
// parse BPMN file into petri net
const iNet = await parser.fromXML(xml);

const contractGenerator = new chorpiler.generators.sol.DefaultContractGenerator();
const gen = await contractGenerator.compile(iNet);

//output directory
const outDir = path.resolve(__dirname, "output");
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(bpmnPath, path.extname(bpmnPath));
const outSol = path.join(outDir, `${base}.sol`);
const outJson = path.join(outDir, `${base}_encoding.json`);



// compile to smart contract
contractGenerator.compile(iNet).then((gen) => {
fs.writeFileSync(outSol, gen.target, { flag: 'w+' });
fs.writeFileSync(outJson, JSON.stringify(ProcessEncoding.toJSON(gen.encoding), null, 2), { flag: "w+" });

console.log(`Wrote ${outSol}`);
console.log(`Wrote ${outJson}`);

  console.log("Process.sol generated.");
  // log encoding of participants and tasks, 
  // can also be written to a .json file
  console.log(ProcessEncoding.toJSON(gen.encoding));
})
   } catch (err) {
    console.error('Generation failed:', err);
    process.exit(1);
  }
})();
