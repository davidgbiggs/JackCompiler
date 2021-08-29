import fs from "fs";

export default class JackTokenizer {
  fileString: string;
  fileIndex;
  tokenSet: boolean;
  token: string;
  static jackSymbolMap: JackMap = {
    "{": true,
    "}": true,
    "(": true,
    ")": true,
    "[": true,
    "]": true,
    ".": true,
    ",": true,
    ";": true,
    "+": true,
    "-": true,
    "*": true,
    "/": true,
    "&": true,
    "|": true,
    "<": true,
    ">": true,
    "=": true,
    "~": true,
  };
  static jackKeywordMap: JackMap = {
    class: true,
    method: true,
    function: true,
    constructor: true,
    int: true,
    boolean: true,
    char: true,
    void: true,
    var: true,
    static: true,
    field: true,
    let: true,
    do: true,
    if: true,
    else: true,
    while: true,
    return: true,
    true: true,
    false: true,
    null: true,
    this: true,
  };

  /** open the input jack file/stream and get ready to tokenize it */
  constructor(filePath: string) {
    this.tokenSet = false;
    this.fileString = fs.readFileSync(filePath, { encoding: "utf-8" }).trim();
    this.fileIndex = 0;
    this.token = "";
  }

  /** are there more tokens in the input? */
  hasMoreTokens(): boolean {
    return this.fileIndex < this.fileString.length - 1;
  }

  setToken(newToken: string): void {
    this.token = newToken;
    this.tokenSet = true;
  }

  /** Gets the next token from the input,
   * and makes it the current token.
   * This method should be called only if
   * hasMoreTokens is true.
   * Initially there is no current token.
   */
  advance(): void {
    const tokenBuilder: string[] = [];
    const conditionalReassign = (falseFunction: () => void) => {
      if (tokenBuilder.length > 0) {
        this.setToken(tokenBuilder.join(""));
      } else {
        falseFunction();
      }
    };

    this.tokenSet = false;
    while (!this.tokenSet) {
      const char = this.fileString[this.fileIndex];
      const secondChar = this.fileString[this.fileIndex + 1];
      if (char + secondChar === "/*") {
        conditionalReassign(() => {
          const endIndex = this.fileString.indexOf("*/", this.fileIndex + 1);
          this.fileIndex = endIndex + 2;
        });
      } else if (char + secondChar === "//") {
        conditionalReassign(() => {
          const endIndex = this.fileString.indexOf("\n", this.fileIndex + 1);
          this.fileIndex = endIndex + 1;
        });
      } else if (char === `"`) {
        conditionalReassign(() => {
          const endIndex = this.fileString.indexOf(`"`, this.fileIndex + 1);
          const stringConstant = this.fileString.slice(
            this.fileIndex,
            endIndex + 1
          );
          this.fileIndex = endIndex + 1;
          this.setToken(stringConstant);
        });
      } else if (JackTokenizer.jackSymbolMap[char]) {
        conditionalReassign(() => {
          this.fileIndex++;
          this.setToken(char);
        });
      } else if (char.match(/\s/)) {
        conditionalReassign(() => {
          this.fileIndex++;
        });
      } else {
        tokenBuilder.push(char);
        this.fileIndex++;
      }
      if (this.fileIndex === this.fileString.length - 1) {
        conditionalReassign(() => {});
        break;
      }
    }
  }

  /** Returns the type of the current token,
   * as a constant.
   */
  tokenType(): TokenType {
    // @ts-ignore
    if (JackTokenizer.jackKeywordMap[this.token]) {
      return "keyword";
    } else if (JackTokenizer.jackSymbolMap[this.token]) {
      return "symbol";
    } else if (this.token.match(/\d/)) {
      return "int_const";
    } else if (this.token.startsWith(`"`)) {
      return "string_const";
    } else {
      return "identifier";
    }
  }

  /** Returns the keyword which is the
   * current token, as a constant.
   * This method should be called only if
   * tokenType is KEYWORD.
   */
  keyWord(): string {
    return this.token;
  }

  /** Returns the character which is the
   * current token. Should be called only
   * if tokenType is SYMBOL
   */
  symbol(): string {
    if (this.token === "&") {
      return "&amp;";
    } else if (this.token === ">") {
      return "&gt;";
    } else if (this.token === "<") {
      return "&lt;";
    } else if (this.token === `"`) {
      return `"`;
    } else {
      return this.token;
    }
  }

  /** Returns the string which is the
   * current token. Should be called only
   * if tokenType is IDENTIFIER.
   */
  identifier(): string {
    return this.token;
  }

  /** Returns the integer value of the
   * current token. Should be called only
   * if tokenType is INT_CONST.
   */
  intVal(): number {
    return Number.parseInt(this.token, 10);
  }

  /** Returns the string value of the
   * current token, without the opening
   * and closing double quotes. Should be
   * called only if tokenType is
   * STRING_CONST.
   */
  stringVal(): string {
    return this.token.slice(1, this.token.length - 1);
  }
}
