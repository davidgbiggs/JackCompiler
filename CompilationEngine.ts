import fs from "fs";
import JackTokenizer from "./JackTokenizer";

export default class CompilationEngine {
  input: JackTokenizer;
  newCommands: string[];
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

  #writeAndAdvance(expected: () => boolean) {
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
          `<identifier> ${this.input.identifier()} </identifier>`
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
    this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
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
    this.#writeAndAdvance(
      () => this.input.token === "static" || this.input.token === "field"
    );
    this.#writeAndAdvance(
      () =>
        this.input.tokenType() === "keyword" ||
        this.input.tokenType() === "identifier"
    );
    this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
    while (this.input.token === ",") {
      this.#writeAndAdvance(() => this.input.token === ",");
      this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
    }
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag(tagName, false);
  }

  /** Compiles a complete method, function,
   * or constructor.
   */
  compileSubroutine(): void {
    this.#writeTag("subroutineDec", true);
    this.#writeAndAdvance(
      () =>
        this.input.token === "constructor" ||
        this.input.token === "function" ||
        this.input.token === "method"
    );
    this.#writeAndAdvance(
      () =>
        this.input.tokenType() === "keyword" ||
        this.input.tokenType() === "identifier"
    );
    this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
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
      this.#writeAndAdvance(
        () =>
          this.input.tokenType() === "keyword" ||
          this.input.tokenType() === "identifier"
      );
      this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
      if (this.input.token === ",") {
        this.#writeAndAdvance(() => true);
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
    this.#writeTag("subroutineBody", false);
  }

  /** Compiles a var declaration. */
  compileVarDec(): void {
    this.#writeTag("varDec", true);
    this.#writeAndAdvance(() => this.input.token === "var");
    this.#writeAndAdvance(
      () =>
        this.input.tokenType() === "keyword" ||
        this.input.tokenType() === "identifier"
    );
    this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
    while (this.input.token === ",") {
      this.#writeAndAdvance(() => this.input.token === ",");
      this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
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
    this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
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

  compileWhile(): void {
    /** Compiles a while statement. */
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

  compileDo(): void {
    /** Compiles a do statement. */
    this.#writeTag("doStatement", true);
    this.#writeAndAdvance(() => this.input.token === "do");
    this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
    if (this.input.token === "(") {
      this.#writeAndAdvance(() => this.input.token === "(");
      // @ts-ignore
      if (this.input.token !== ")") {
        this.compileExpressionList();
      } else {
        this.#writeTag("expressionList", true);
        this.#writeTag("expressionList", false);
      }
      this.#writeAndAdvance(() => this.input.token === ")");
    } else if (this.input.token === ".") {
      this.#writeAndAdvance(() => this.input.token === ".");
      this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
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
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag("doStatement", false);
  }

  compileReturn(): void {
    /** Compiles a return statement. */
    this.#writeTag("returnStatement", true);
    this.#writeAndAdvance(() => this.input.token === "return");
    if (this.input.token !== ";") {
      this.compileExpression();
    }
    this.#writeAndAdvance(() => this.input.token === ";");
    this.#writeTag("returnStatement", false);
  }

  compileExpression(): void {
    /** Compiles an expression. */
    this.#writeTag("expression", true);
    this.compileTerm();
    while (CompilationEngine.ops[this.input.token]) {
      this.#writeAndAdvance(() => this.input.tokenType() === "symbol");
      this.compileTerm();
    }
    this.#writeTag("expression", false);
  }

  compileTerm(): void {
    /** Compiles a term. If the current token is
     * an identifier, the routine must resolve it
     * into a variable, an array element, or a
     * subroutine call. A single lookahead
     * token, which may be [, (, or ., suffices
     * to distinguish between the possibilities.
     * Any other token is not part of this term
     * and should not be advanced over.
     */
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
      this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
      if (this.input.token === ".") {
        this.#writeAndAdvance(() => this.input.token === ".");
        this.#writeAndAdvance(() => this.input.tokenType() === "identifier");
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

  compileExpressionList(): number {
    /** Compiles a (possibly empty) comma-
     * separated list of expressions. Returns
     * the number of expressions in the list.
     */
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
