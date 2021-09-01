import fs from "fs";
import JackTokenizer from "./JackTokenizer";
import SymbolTable from "./SymbolTable";

export default class CompilationEngine {
  input: JackTokenizer;
  classTable: SymbolTable;
  subTable: SymbolTable;
  newCommands: string[];
  className: string;
  writeFilePath: string;

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

  static unaryOp: JackMap = {
    "~": true,
    "-": true,
  };

  static ops: JackMap = {
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

  /** Creates a new compilation engine with
   * the given input and output.
   * The next routine called (by the
   * JackAnalyzer module) must be
   * compileClass
   */
  constructor(tokenizer: JackTokenizer, _writeFilePath: string) {
    this.className = "";
    this.classTable = new SymbolTable();
    this.subTable = new SymbolTable();
    this.input = tokenizer;
    this.input.advance();
    this.newCommands = [];
    this.writeFilePath = _writeFilePath;
  }

  #writeTag(tagName: string, isOpeningTag: boolean) {
    if (isOpeningTag) {
      this.newCommands.push(`<${tagName}>`);
    } else {
      this.newCommands.push(`</${tagName}>`);
    }
  }

  #writeAndAdvance(
    expected: () => boolean,
    category?: "class" | "subroutine" | SymbolKind,
    index?: number | "no index",
    context?: "defined" | "used"
  ) {
    if (!expected()) {
      console.log(
        this.newCommands.slice(Math.max(this.newCommands.length - 10, 1))
      );
      console.log("token: ", this.input.token);
      throw new Error("unexpected token");
    } else {
      if (this.input.tokenType() === "keyword") {
        this.newCommands.push(`<keyword> ${this.input.keyWord()} </keyword>`);
      } else if (this.input.tokenType() === "symbol") {
        this.newCommands.push(`<symbol> ${this.input.symbol()} </symbol>`);
      } else if (this.input.tokenType() === "identifier") {
        this.newCommands.push(
          `<identifier> ${this.input.identifier()}, category: ${category}, index: ${index}, context: ${context} </identifier>`
        );
      } else if (this.input.tokenType() === "int_const") {
        this.newCommands.push(
          `<integerConstant> ${this.input.intVal()} </integerConstant>`
        );
      } else if (this.input.tokenType() === "string_const") {
        this.newCommands.push(
          `<stringConstant> ${this.input.stringVal()} </stringConstant>`
        );
      }
      this.input.advance();
    }
  }

  #close() {
    fs.writeFile(this.writeFilePath, this.newCommands.join("\n"), (err) => {
      if (err) {
        console.error(err);
        return;
      } else {
        // console.log("file written");
      }
    });
  }

  /** Compiles a complete class. */
  compileClass(): void {
    this.#writeTag("class", true);
    this.#writeAndAdvance(() => this.input.token === "class");
    this.className = this.input.token;
    this.#writeAndAdvance(
      () => this.input.tokenType() === "identifier",
      "class",
      "no index",
      "defined"
    );
    this.#writeAndAdvance(() => this.input.token === "{");
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
    this.#writeAndAdvance(() => this.input.token === "}");
    this.#writeTag("class", false);
    this.#close();
  }

  /** Compiles a static variable declaration,
   * or a field declaration.
   */
  compileClassVarDec(): void {
    const tagName = "classVarDec";
    this.#writeTag(tagName, true);
    // @ts-ignore
    const kind: SymbolKind = this.input.token;
    this.#writeAndAdvance(
      () => this.input.token === "static" || this.input.token === "field"
    );
    // @ts-ignore
    const type: SymbolType = this.input.token;
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
    this.classTable.define(name, type, kind);
    this.#writeAndAdvance(
      () => this.input.tokenType() === "identifier",
      kind,
      this.classTable.indexOf(name),
      "defined"
    );
    while (this.input.token === ",") {
      this.#writeAndAdvance(() => this.input.token === ",");
      let name = this.input.token;
      this.classTable.define(name, type, kind);
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        kind,
        this.classTable.indexOf(name),
        "defined"
      );
    }
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag(tagName, false);
  }

  /** Compiles a complete method, function,
   * or constructor.
   */
  compileSubroutine(): void {
    this.#writeTag("subroutineDec", true);
    if (this.input.token === "method") {
      this.subTable.define("this", this.className, "arg");
    }
    const isConstructor = this.input.token === "constructor";
    this.#writeAndAdvance(
      () =>
        this.input.token === "constructor" ||
        this.input.token === "function" ||
        this.input.token === "method"
    );
    if (isConstructor) {
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        "class",
        "no index",
        "used"
      );
    } else {
      this.#writeAndAdvance(() => this.input.tokenType() === "keyword");
    }
    this.#writeAndAdvance(
      () => this.input.tokenType() === "identifier",
      "subroutine",
      "no index",
      "defined"
    );
    this.#writeAndAdvance(() => this.input.token === "(");
    this.compileParameterList();
    this.#writeAndAdvance(() => this.input.token === ")");
    this.compileSubroutineBody();
    this.#writeTag("subroutineDec", false);
  }

  /** Compiles a (possibly empty) parameter
   * list. Does not handle the enclosing
   * parentheses tokens ( and ).
   */
  compileParameterList(): void {
    this.#writeTag("parameterList", true);
    let paramsRemain = this.input.token !== ")";
    while (paramsRemain) {
      const type = this.input.token;
      this.#writeAndAdvance(
        () =>
          this.input.tokenType() === "keyword" ||
          this.input.tokenType() === "identifier"
      );
      const name = this.input.token;
      this.subTable.define(name, type, "arg");
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        "arg",
        this.subTable.indexOf(name),
        "defined"
      );
      if (this.input.token === ",") {
        this.#writeAndAdvance(() => this.input.token === ",");
      } else {
        paramsRemain = false;
      }
    }
    this.#writeTag("parameterList", false);
  }

  /** Compiles a subroutine's body. */
  compileSubroutineBody(): void {
    this.#writeTag("subroutineBody", true);
    this.#writeAndAdvance(() => this.input.token === "{");
    while (this.input.token === "var") {
      this.compileVarDec();
    }
    this.compileStatements();
    this.#writeAndAdvance(() => this.input.token === "}");
    this.subTable.reset();
    this.#writeTag("subroutineBody", false);
  }

  /** Compiles a var declaration. */
  compileVarDec(): void {
    this.#writeTag("varDec", true);
    this.#writeAndAdvance(() => this.input.token === "var");
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
    this.#writeTag("statements", true);
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
    this.#writeTag("statements", false);
  }

  /** Compiles a let statement */
  compileLet(): void {
    this.#writeTag("letStatement", true);
    this.#writeAndAdvance(() => this.input.token === "let");
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
    this.#writeAndAdvance(
      () => this.input.tokenType() === "identifier",
      // @ts-ignore
      kind,
      index,
      "defined"
    );
    if (this.input.token === "[") {
      this.#writeAndAdvance(() => this.input.token === "[");
      this.compileExpression();
      this.#writeAndAdvance(() => this.input.token === "]");
    }
    this.#writeAndAdvance(() => this.input.token === "=");
    this.compileExpression();
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag("letStatement", false);
  }

  /** Compiles an if statement,
   * possibly with a trailing else clause.
   */
  compileIf(): void {
    this.#writeTag("ifStatement", true);
    this.#writeAndAdvance(() => this.input.token === "if");
    this.#writeAndAdvance(() => this.input.token === "(");
    this.compileExpression();
    this.#writeAndAdvance(() => this.input.token === ")");
    this.#writeAndAdvance(() => this.input.token === "{");
    this.compileStatements();
    this.#writeAndAdvance(() => this.input.token === "}");
    if (this.input.token === "else") {
      this.#writeAndAdvance(() => true);
      this.#writeAndAdvance(() => this.input.token === "{");
      this.compileStatements();
      this.#writeAndAdvance(() => this.input.token === "}");
    }
    this.#writeTag("ifStatement", false);
  }

  /** Compiles a while statement. */
  compileWhile(): void {
    this.#writeTag("whileStatement", true);
    this.#writeAndAdvance(() => this.input.token === "while");
    this.#writeAndAdvance(() => this.input.token === "(");
    this.compileExpression();
    this.#writeAndAdvance(() => this.input.token === ")");
    this.#writeAndAdvance(() => this.input.token === "{");
    this.compileStatements();
    this.#writeAndAdvance(() => this.input.token === "}");
    this.#writeTag("whileStatement", false);
  }

  /** Compiles a do statement. */
  compileDo(): void {
    this.#writeTag("doStatement", true);
    this.#writeAndAdvance(() => this.input.token === "do");
    // check if it's a class or subroutine
    const oldToken = this.input.token;
    this.input.advance();
    if (this.input.token === ".") {
      this.newCommands.push(
        `<identifier> ${oldToken}, category: class, index: no index, context: used </identifier>`
      );
      this.#writeAndAdvance(() => this.input.token === ".");
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        "subroutine",
        "no index",
        "used"
      );
    } else {
      this.newCommands.push(
        `<identifier> ${oldToken}, category: subroutine, index: no index, context: used </identifier>`
      );
    }
    this.#writeAndAdvance(() => this.input.token === "(");
    // @ts-ignore
    if (this.input.token !== ")") {
      this.compileExpressionList();
    } else {
      this.#writeTag("expressionList", true);
      this.#writeTag("expressionList", false);
    }
    this.#writeAndAdvance(() => this.input.token === ")");
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag("doStatement", false);
  }

  /** Compiles a return statement. */
  compileReturn(): void {
    this.#writeTag("returnStatement", true);
    this.#writeAndAdvance(() => this.input.token === "return");
    if (this.input.token !== ";") {
      this.compileExpression();
    }
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag("returnStatement", false);
  }

  /** Compiles an expression. */
  compileExpression(): void {
    this.#writeTag("expression", true);
    this.compileTerm();
    while (CompilationEngine.ops[this.input.token]) {
      this.#writeAndAdvance(() => this.input.tokenType() === "symbol");
      this.compileTerm();
    }
    this.#writeTag("expression", false);
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
    this.#writeTag("term", true);
    if (this.input.tokenType() === "int_const") {
      this.#writeAndAdvance(() => this.input.tokenType() === "int_const");
    } else if (this.input.tokenType() === "string_const") {
      this.#writeAndAdvance(() => this.input.tokenType() === "string_const");
    } else if (CompilationEngine.keywordConstant[this.input.token]) {
      this.#writeAndAdvance(
        () => CompilationEngine.keywordConstant[this.input.token]
      );
    } else if (CompilationEngine.unaryOp[this.input.token]) {
      this.#writeAndAdvance(() => CompilationEngine.unaryOp[this.input.token]);
      this.compileTerm();
    } else if (this.input.token === "(") {
      this.#writeAndAdvance(() => this.input.token === "(");
      this.compileExpression();
      this.#writeAndAdvance(() => this.input.token === ")");
    } else if (this.input.tokenType() === "identifier") {
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
        index = "no index";
        // class or subroutine identifier
        if (this.input.token[0].toUpperCase() === this.input.token[0]) {
          kind = "class";
        } else {
          kind = "subroutine";
        }
      }
      this.#writeAndAdvance(
        () => this.input.tokenType() === "identifier",
        // @ts-ignore
        kind,
        index,
        "used"
      );
      if (this.input.token === ".") {
        this.#writeAndAdvance(() => this.input.token === ".");
        this.#writeAndAdvance(
          () => this.input.tokenType() === "identifier",
          "subroutine",
          "no index",
          "used"
        );
        this.#writeAndAdvance(() => this.input.token === "(");
        // @ts-ignore
        if (this.input.token !== ")") {
          this.compileExpressionList();
        } else {
          this.#writeTag("expressionList", true);
          this.#writeTag("expressionList", false);
        }
        this.#writeAndAdvance(() => this.input.token === ")");
      } else if (this.input.token === "[") {
        this.#writeAndAdvance(() => this.input.token === "[");
        this.compileExpression();
        this.#writeAndAdvance(() => this.input.token === "]");
      } else if (this.input.token === "(") {
        this.#writeAndAdvance(() => this.input.token === "(");
        // @ts-ignore
        if (this.input.token !== ")") {
          this.compileExpressionList();
        } else {
          this.#writeTag("expressionList", true);
          this.#writeTag("expressionList", false);
        }
        this.#writeAndAdvance(() => this.input.token === ")");
      }
    }
    this.#writeTag("term", false);
  }

  /** Compiles a (possibly empty) comma-
   * separated list of expressions. Returns
   * the number of expressions in the list.
   */
  compileExpressionList(): number {
    let count = 1;
    this.#writeTag("expressionList", true);
    this.compileExpression();
    while (this.input.token === ",") {
      count = count + 1;
      this.#writeAndAdvance(() => this.input.token === ",");
      this.compileExpression();
    }
    this.#writeTag("expressionList", false);
    return count;
  }
}
