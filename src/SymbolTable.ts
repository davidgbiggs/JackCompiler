// keeps track of all the variables found in the Jack code

export default class SymbolTable {
  argNum: number;
  staticNum: number;
  varNum: number;
  fieldNum: number;

  symbolMap: SymbolMap;

  constructor() {
    this.staticNum = 0;
    this.argNum = 0;
    this.varNum = 0;
    this.fieldNum = 0;
    this.symbolMap = {};
  }

  reset(): void {
    this.symbolMap = {};
    this.argNum = 0;
    this.staticNum = 0;
    this.varNum = 0;
    this.fieldNum = 0;
  }

  define(name: string, type: string, kind: SymbolKind): void {
    let index;
    if (kind === "arg") {
      index = this.argNum;
      this.argNum++;
    } else if (kind === "field") {
      index = this.fieldNum;
      this.fieldNum++;
    } else if (kind === "static") {
      index = this.staticNum;
      this.staticNum++;
    } else {
      index = this.varNum;
      this.varNum++;
    }
    const newSymbol: SymbolEntry = { type, kind, index };
    this.symbolMap[name] = newSymbol;
  }

  varCount(kind: SymbolKind): number {
    if (kind === "arg") {
      return this.argNum + 1;
    } else if (kind === "field") {
      return this.argNum + 1;
    } else if (kind === "static") {
      return this.argNum + 1;
    } else {
      return this.argNum + 1;
    }
  }

  kindOf(name: string): SymbolKind | "none" {
    return this.symbolMap[name] ? this.symbolMap[name].kind : "none";
  }

  typeOf(name: string): string {
    return this.symbolMap[name].type;
  }

  indexOf(name: string): number {
    return this.symbolMap[name].index;
  }
}
