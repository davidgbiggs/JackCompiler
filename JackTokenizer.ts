class JackTokenizer {
  constructor(inputFile: string) {
    // open the input jack file/stream and get ready to tokenize it
  }

  hasMoreTokens(): boolean {
    // are there more tokens in the input?
    return true;
  }

  advance(): void {
    /** Gets the next token from the input,
     * and makes it the current token.
     * This method should be called only if
     * hasMoreTokens is true.
     * Initially there is no current token.
     */
  }

  tokenType(): TokenType {
    /** Returns the type of the current token,
     * as a constant.
     */
    return "KEYWORD";
  }

  keyWord(): KeyWord {
    /** Returns the keyword which is the
     * current token, as a constant.
     * This method should be called only if
     * tokenType is KEYWORD.
     */
    return "NULL";
  }

  symbol(): JackSymbol {
    /** Returns the character which is the
     * current token. Should be called only
     * if tokenTye is JackSymbol
     */
    return ")";
  }

  identifier(): string {
    /** Returns the string which is the
     * current token. Should be called only
     * if tokenType is IDENTIFIER.
     */
    return "";
  }

  intVal(): number {
    /** Returns the integer value of the
     * current token. Should be called only
     * if TokenType is INT_CONST.
     */
    return 0;
  }

  stringVal(): string {
    /** Returns the string value of the
     * current token, without the opening
     * and closing double quotes. Should be
     * called only if tokenType is
     * STRING_CONST.
     */
    return "";
  }
}
