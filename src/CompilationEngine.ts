import fs from "fs";
import JackTokenizer from "./JackTokenizer";
import SymbolTable from "./SymbolTable";
import { VMWriter } from "./VMWriter";

export default class CompilationEngine {
  input: JackTokenizer;
  output: VMWriter;
  classTable: SymbolTable;
  subTable: SymbolTable;
  className: string;
  labelCount: number;

  static statementKeyword: JackMap = {
    let: true,
    if: true,
    while: true,
    do: true,
    return: true,
  };

  static keywordConstant: JackMap = {
    true: true,
    false: true,
    null: true,
    this: true,
  };

  static isUnaryOp: JackMap = {
    "~": true,
    "-": true,
  };

  static isOp: JackMap = {
    "+": true,
    "-": true,
    "/": true,
    "*": true,
    "&": true,
    "|": true,
    "<": true,
    ">": true,
    "=": true,
  };

  static opToVM: opToVMMap = {
    "+": "add",
    "-": "sub",
    "&": "and",
    "|": "or",
    "<": "lt",
    ">": "gt",
    "=": "eq",
  };

  static unaryOpToVM: opToVMMap = {
    "~": "not",
    "-": "neg",
  };

  /** Creates a new compilation engine with
   * the given input and output.
   * The next routine called (by the
   * JackAnalyzer module) must be
   * compileClass
   */
  constructor(tokenizer: JackTokenizer, writer: VMWriter) {
    this.className = "";
    this.classTable = new SymbolTable();
    this.subTable = new SymbolTable();
    this.input = tokenizer;
    this.input.advance();
    this.output = writer;
    this.labelCount = 0;
  }

  #writeTag(tagName: string, isOpeningTag: boolean) {
    if (isOpeningTag) {
      // this.newCommands.push(`<${tagName}>`);
    } else {
      // this.newCommands.push(`</${tagName}>`);
    }
  }

  #writeAndAdvance(
    expected: () => boolean,
    category?: "class" | "subroutine" | SymbolKind,
    index?: number | "no index",
    context?: "defined" | "used"
  ) {
    if (!expected()) {
      console.log("token: ", this.input.token);
      throw new Error("unexpected token");
    } else {
      this.input.advance();
    }
  }

  /** Compiles a complete class. */
  compileClass(): void {
    this.input.advance(); // class token
    this.className = this.input.token;
    this.input.advance(); // the name of the class
    this.input.advance(); // {
    while (this.input.token === "static" || this.input.token === "field") {
      this.compileClassVarDec();
    }
    while (
      this.input.token === "constructor" ||
      this.input.token === "function" ||
      this.input.token === "method"
    ) {
      this.compileSubroutine();
    }
    this.input.advance(); // }
    this.output.close();
  }

  /** Compiles a static variable declaration,
   * or a field declaration.
   */
  compileClassVarDec(): void {
    // @ts-ignore
    const kind: SymbolKind = this.input.token;
    this.input.advance(); // static or field
    // @ts-ignore
    const type: SymbolType = this.input.token;
    if (this.input.tokenType() === "identifier") {
      this.input.advance(); // jack object type
    } else {
      this.input.advance(); // jack keyword type
    }
    let name = this.input.token;
    this.classTable.define(name, type, kind);
    this.input.advance(); // var name
    while (this.input.token === ",") {
      this.input.advance(); // ,
      let name = this.input.token;
      this.classTable.define(name, type, kind);
      this.input.advance(); // var name
    }
    this.input.advance(); // ;
  }

  /** Compiles a complete method, function,
   * or constructor.
   */
  compileSubroutine(): void {
    this.subTable.subType = this.input.token;
    this.input.advance(); // "function", "method", or "constructor"
    this.subTable.returnType = this.input.token;
    this.input.advance(); // return type
    this.subTable.subName = this.input.token;
    this.input.advance(); // name of subroutine
    this.subTable.reset(
      this.subTable.subType,
      this.subTable.returnType,
      this.subTable.subName
    );
    this.input.advance(); // (
    if (this.subTable.subType === "method") {
      this.subTable.define("this", this.className, "arg");
    }
    this.compileParameterList();
    this.input.advance(); // )
    this.compileSubroutineBody();
  }

  /** Compiles a (possibly empty) parameter
   * list. Does not handle the enclosing
   * parentheses tokens ( and ).
   */
  compileParameterList(): void {
    let paramsRemain = this.input.token !== ")";
    while (paramsRemain) {
      const type = this.input.token;
      this.input.advance(); // type of parameter
      const name = this.input.token;
      this.subTable.define(name, type, "arg");
      this.input.advance(); // param name
      if (this.input.token === ",") {
        this.input.advance(); // ,
      } else {
        paramsRemain = false;
      }
    }
  }

  /** Compiles a subroutine's body. */
  compileSubroutineBody(): void {
    this.input.advance(); // {
    while (this.input.token === "var") {
      this.compileVarDec();
    }
    this.output.writeFunction(
      `${this.className}.${this.subTable.subName}`,
      this.subTable.varCount("var")
    );
    if (this.subTable.subType === "method") {
      this.output.writePush("argument", 0);
      this.output.writePop("pointer", 0);
    } else if (this.subTable.subType === "constructor") {
      this.output.writePush("constant", this.classTable.varCount("field"));
      this.output.writeCall("Memory.alloc", 1);
      this.output.writePop("pointer", 0);
    }
    this.compileStatements();
    this.input.advance(); // }
  }

  /** Compiles a var declaration. */
  compileVarDec(): void {
    this.input.advance(); // var
    const type = this.input.token;
    if (this.input.tokenType() === "identifier") {
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        "class",
        "no index",
        "used"
      );
    } else {
      this.#writeAndAdvance(() => this.input.tokenType() === "keyword");
    }
    let name = this.input.token;
    this.subTable.define(name, type, "var");
    this.#writeAndAdvance(
      () => this.input.tokenType() === "identifier",
      "var",
      this.subTable.indexOf(name),
      "defined"
    );
    while (this.input.token === ",") {
      this.#writeAndAdvance(() => this.input.token === ",");
      let name = this.input.token;
      this.subTable.define(name, type, "var");
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        "var",
        this.subTable.indexOf(name),
        "defined"
      );
    }
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag("varDec", false);
  }

  /** Compiles a sequence of statements.
   * Does not handle the enclosing curly
   * bracket tokens { and }
   */
  compileStatements(): void {
    while (CompilationEngine.statementKeyword[this.input.token]) {
      if (this.input.token === "let") {
        this.compileLet();
      } else if (this.input.token === "if") {
        this.compileIf();
      } else if (this.input.token === "while") {
        this.compileWhile();
      } else if (this.input.token === "do") {
        this.compileDo();
      } else if (this.input.token === "return") {
        this.compileReturn();
      } else {
        throw new Error("At least one statement expected");
      }
    }
  }

  /** Compiles a let statement */
  compileLet(): void {
    this.input.advance(); // let token
    let name = this.input.token;
    let kind;
    let index;
    if (this.subTable.kindOf(name) !== "none") {
      kind = this.subTable.kindOf(name);
      index = this.subTable.indexOf(name);
    } else if (this.classTable.kindOf(name) !== "none") {
      kind = this.classTable.kindOf(name);
      index = this.classTable.indexOf(name);
    } else {
      throw new Error("let assignment to unknown variable");
    }
    this.input.advance(); // the name of the variable we're assigning
    // TODO: add array assignment
    if (this.input.token === "[") {
      this.input.advance(); // [
      this.output.writePush(kind, index);
      this.compileExpression();
      this.input.advance(); // ]
      this.output.writeArithmetic("add");
      this.input.advance(); // =
      this.compileExpression();
      this.output.writePop("temp", 0);
      this.output.writePop("pointer", 1);
      this.output.writePush("temp", 0);
      this.output.writePop("that", 0);
    } else {
      this.input.advance(); // =
      this.compileExpression();
      this.output.writePop(kind as VMSegment, index);
    }
    this.input.advance(); // ;
  }

  /** Compiles an if statement,
   * possibly with a trailing else clause.
   */
  compileIf(): void {
    const labelNum = this.labelCount++;
    const falseLabel = `ifFalse@${labelNum}`;
    const trueLabel = `ifTrue@${labelNum}`;
    this.input.advance(); // if
    this.input.advance(); // (
    this.compileExpression();
    this.output.writeArithmetic("not");
    this.output.writeIf(falseLabel);
    this.input.advance(); // )
    this.input.advance(); // {
    this.compileStatements();
    this.output.writeGoto(trueLabel);
    this.input.advance(); // }
    this.output.writeLabel(falseLabel);
    if (this.input.token === "else") {
      this.input.advance(); // else
      this.input.advance(); // {
      this.compileStatements();
      this.input.advance(); // }
    }
    this.output.writeLabel(trueLabel);
  }

  /** Compiles a while statement. */
  compileWhile(): void {
    const labelNum = this.labelCount++;
    const topLabel = `whileTop@${labelNum}`;
    const endLabel = `whileEnd@${labelNum}`;
    this.input.advance(); // while
    this.input.advance(); // (
    this.output.writeLabel(topLabel);
    this.compileExpression();
    this.output.writeArithmetic("not");
    this.output.writeIf(endLabel);
    this.input.advance(); // )
    this.input.advance(); // {
    this.compileStatements();
    this.output.writeGoto(topLabel);
    this.output.writeLabel(endLabel);
    this.input.advance(); // }
  }

  /** Compiles a do statement. */
  compileDo(): void {
    this.input.advance(); // do
    this.compileExpression();
    this.output.writePop("temp", 0);
    this.input.advance(); // ;
  }

  /** Compiles a return statement. */
  compileReturn(): void {
    this.input.advance(); // return
    if (this.subTable.subType === "constructor") {
      this.output.writePush("pointer", 0);
      this.input.advance(); // this
    } else if (this.subTable.returnType === "void") {
      this.output.writePush("constant", 0);
    } else if (this.input.token !== ";") {
      this.compileExpression();
    }
    this.output.writeReturn();
    this.input.advance(); // ;
  }

  /** Compiles an expression. */
  compileExpression(): void {
    this.compileTerm();
    while (CompilationEngine.isOp[this.input.token]) {
      const op = this.input.token;
      this.input.advance();
      this.compileTerm();
      if (op === "*") {
        this.output.writeCall("Math.multiply", 2);
      } else if (op === "/") {
        this.output.writeCall("Math.divide", 2);
      } else if (CompilationEngine.opToVM[op]) {
        this.output.writeArithmetic(CompilationEngine.opToVM[op]);
      } else {
        throw new Error("expected operation token");
      }
    }
  }

  /** Compiles a term. If the current token is
   * an identifier, the routine must resolve it
   * into a variable, an array element, or a
   * subroutine call. A single lookahead
   * token, which may be [, (, or ., suffices
   * to distinguish between the possibilities.
   * Any other token is not part of this term
   * and should not be advanced over.
   */
  compileTerm(): void {
    if (this.input.tokenType() === "int_const") {
      this.output.writePush("constant", Number.parseInt(this.input.token, 10));
      this.input.advance(); // int constant
    } else if (this.input.tokenType() === "string_const") {
      this.output.writePush("constant", this.input.token.length - 2);
      this.output.writeCall("String.new", 1);
      let i = 1;
      while (i < this.input.token.length - 1) {
        this.output.writePush("constant", this.input.token.charCodeAt(i));
        // one of the args is the string itself
        this.output.writeCall("String.appendChar", 2);
        i++;
      }
      this.input.advance(); // string constant
    } else if (CompilationEngine.keywordConstant[this.input.token]) {
      const keyword = this.input.token;
      if (keyword === "null" || keyword === "false") {
        this.output.writePush("constant", 0);
      } else if (keyword === "true") {
        this.output.writePush("constant", 1);
        this.output.writeArithmetic("neg");
      } else if (keyword === "this") {
        this.output.writePush("pointer", 0);
      } else {
        throw new Error("keyword expected in compileTerm()");
      }
      this.input.advance(); // keyword token
    } else if (CompilationEngine.isUnaryOp[this.input.token]) {
      const unaryOp = this.input.token;
      this.input.advance(); // unary character
      this.compileTerm();
      this.output.writeArithmetic(CompilationEngine.unaryOpToVM[unaryOp]);
    } else if (this.input.token === "(") {
      this.input.advance(); // (
      this.compileExpression();
      this.input.advance(); // )
    } else if (this.input.tokenType() === "identifier") {
      let firstToken = this.input.token;
      let kind: VMSegment | "none";
      let index;
      let type;
      if (this.subTable.kindOf(firstToken) !== "none") {
        kind = this.subTable.kindOf(firstToken);
        index = this.subTable.indexOf(firstToken);
        type = this.subTable.typeOf(firstToken);
        // } else if (this.classTable.kindOf(firstToken) !== "none") {
      } else if (this.classTable.kindOf(firstToken) !== "none") {
        kind = this.classTable.kindOf(firstToken);
        index = this.classTable.indexOf(firstToken);
        type = this.classTable.typeOf(firstToken);
      } else {
        kind = "none";
      }
      this.input.advance(); // identifier
      if (this.input.token === ".") {
        // method, constructor or function call: depends on if firstToken is in table
        this.input.advance(); // .
        const secondToken = this.input.token;
        this.input.advance(); // identifier
        this.input.advance(); // (
        // method case: we need to push the object onto the stack before calling, and set numArgs to localArgs + 1
        // constructor case: we need to pop the base of the newly constructed object off of the stack (should be handled in let statement)
        // function case: no special treatment
        let nArgs;
        // @ts-ignore
        if (kind !== "none") {
          this.output.writePush(kind, index as number); // pushing "this" to the stack
        }
        // @ts-ignore
        if (this.input.token !== ")") {
          nArgs = this.compileExpressionList();
        }
        if (kind !== "none") {
          this.output.writeCall(`${type}.${secondToken}`, (nArgs ?? 0) + 1);
        } else {
          this.output.writeCall(`${firstToken}.${secondToken}`, nArgs ?? 0);
        }
        this.input.advance(); // )
      } else if (this.input.token === "(") {
        // local method
        this.input.advance(); // (
        let nArgs;
        this.output.writePush("pointer", 0); // pushing "this" to the stack
        // @ts-ignore
        if (this.input.token !== ")") {
          nArgs = this.compileExpressionList();
        }
        this.output.writeCall(
          `${this.className}.${firstToken}`,
          (nArgs ?? 0) + 1
        );
        this.input.advance(); // )
      } else if (this.input.token === "[") {
        // array: firstToken is base address
        this.input.advance(); // "["
        // set pointer 1 to the entry's address: arr + i
        // push the entry's address
        this.output.writePush(`${kind}`, index as number);
        // @ts-ignore
        this.compileExpression();
        this.output.writeArithmetic("add");
        this.output.writePop("pointer", 1);
        this.output.writePush("that", 0);
        this.input.advance(); // "]"
      } else {
        // regular variable
        this.output.writePush(kind, index as number);
      }
    }
  }

  /** Compiles a (possibly empty) comma-
   * separated list of expressions. Returns
   * the number of expressions in the list.
   */
  compileExpressionList(): number {
    let count = 1;
    this.compileExpression();
    while (this.input.token === ",") {
      count = count + 1;
      this.input.advance(); // ,
      this.compileExpression();
    }
    return count;
  }
}
