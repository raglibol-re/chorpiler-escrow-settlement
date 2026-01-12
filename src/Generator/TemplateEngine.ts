import Mustache from "mustache";
import { InteractionNet } from "../Parser/InteractionNet";
import util from 'util';
import * as fs from 'fs';
import { CaseVariable } from "./Encoding/Encoding";
import { INetEncoder } from "./Encoder";
import { MustacheEncoding } from "./Encoding/MustacheEncoding";
import { TriggerEncoding } from "./Encoding/TriggerEncoding";

const readFile = util.promisify(fs.readFile);

//TODO by RE: Update this generator to also render EscrowSettlement.sol

export interface ITemplateEngine {
  addCaseVariable(variable: CaseVariable): void;
  deleteCaseVariable(variableName: string): boolean;
  getCaseVariable(variableName: string): CaseVariable | undefined;

  //compile(unfoldSubNets: boolean): Promise<{target: string, encoding: TriggerEncoding}>
  //setTemplatePath(path: string): void;
  //getTemplate(): Promise<string>

  // allow requesting extra templates and return extras
  compile(unfoldSubNets?: boolean, loopProtection?: boolean, extraTemplates?: Array<{name: string, path: string}>):
    Promise<{ target: string; encoding: TriggerEncoding; extras?: Record<string, string> }>;
  setTemplatePath(path: string): void;
  getTemplate(): Promise<string>
}

export abstract class TemplateEngine implements ITemplateEngine {

  constructor(
    public iNet: InteractionNet, 
    private templatePath: string, 
    private caseVariables = new Map<string, CaseVariable>(),
    private templatePartials = new Array<{ partial: string, path: string}>()
  ) { }

  //async compile(unfoldSubNets = false, loopProtection = true) {
  //RE: enable extra templates
    async compile(unfoldSubNets = false, loopProtection = true, extraTemplates?: Array<{name: string, path: string}>) {
    if (this.iNet.initial == null || this.iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    // RE: change to support extra templates
    const iNet: InteractionNet = {...this.iNet}; // Deep copy: why?
    const template: string = await this.getTemplate();
    const partials = this.templatePartials.reduce((acc: Record<string, string>, partial) => { 
      acc[partial.partial] = (fs.readFileSync(partial.path)).toString();
      return acc;
     }, {} );

    const encoder = new INetEncoder();
    const gen = encoder.generate(iNet, { unfoldSubNets, loopProtection });
    gen.caseVariables = this.caseVariables;

    //RE: render extra templates if provided
     const main = Mustache.render(template, MustacheEncoding.fromEncoding(gen), partials);


    //return { target: Mustache.render(template, MustacheEncoding.fromEncoding(gen), partials), 
   //   encoding: TriggerEncoding.fromEncoding(gen) }; 
  //}

  //RE: enable extra templates
  const extras: Record<string, string> = {};
    if (extraTemplates) {
      for (const t of extraTemplates) {
        const tpl = fs.readFileSync(t.path).toString();
        extras[t.name] = Mustache.render(tpl, MustacheEncoding.fromEncoding(gen), partials);
      }
    }

    const result = {
      target: main,
      encoding: TriggerEncoding.fromEncoding(gen),
    } as { target: string; encoding: TriggerEncoding; extras?: Record<string, string> };

    if (Object.keys(extras).length) {
      result.extras = extras;
    }

    return result;
  }

  addCaseVariable(variable: CaseVariable) {
    this.caseVariables.set(variable.name, variable);
  }
  deleteCaseVariable(variableName: string) {
    return this.caseVariables.delete(variableName);
  }
  getCaseVariable(variableName: string) {
    return this.caseVariables.get(variableName);
  }
  setTemplatePath(path: string): void {
    this.templatePath = path;
  }
  async getTemplate(): Promise<string> {
    return (await readFile(this.templatePath)).toString();
  }
}