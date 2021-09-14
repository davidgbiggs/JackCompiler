// keeps track of all the variables found in the Jack code

export default class SymbolTable {
  argNum: number;
  staticNum: number;
  varNum: number;
  fieldNum: number;
  subType: string;
  returnType: string;
  subName: string;

  symbolMap: SymbolMap;

  constructor() {
    this.staticNum = 0;
    this.argNum = 0;
    this.varNum = 0;
    this.fieldNum = 0;
    this.subType = "";
    this.returnType = "";
    this.subName = "";
    this.symbolMap = {};
  }

  reset(subType: string, returnType: string, subName: string): void {
    this.subType = subType;
    this.returnType = returnType;
    this.subName = subName;
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
      return this.argNum;
    } else if (kind === "field") {
      return this.fieldNum;
    } else if (kind === "static") {
      return this.staticNum;
    } else {
      return this.varNum;
    }
  }

  kindOf(name: string): VMSegment | "none" {
    if (this.symbolMap[name]) {
      const kind = this.symbolMap[name].kind;
      if (kind === "field") {
        return "this";
      } else if (kind === "arg") {
        return "argument";
      } else if (kind === "var") {
        return "local";
      } else if (kind === "static") {
        return "static";
      } else {
        throw new Error("unexpected variable type");
      }
    } else {
      return "none";
    }
  }

  typeOf(name: string): string {
    return this.symbolMap[name].type;
  }

  indexOf(name: string): number {
    return this.symbolMap[name].index;
  }
}
