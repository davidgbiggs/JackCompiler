import JackTokenizer from "./JackTokenizer";

export default class CompilationEngine {
  constructor(input: JackTokenizer, outputFile: string) {
    /** Creates a new compilation engine with
     * the given input and output.
     * The next routine called (by the
     * JackAnalyzer module) must be
     * compileClass
     */
  }

  compileClass(): void {
    // Compiles a complete class.
  }

  compileClassVarDec(): void {
    /** Compiles a static variable declaration,
     * or a field declaration.
     */
  }

  compileSubroutine(): void {
    /** Compiles a complete method, function,
     * or constructor.
     */
  }

  compileParameterList(): void {
    /** Compiles a (possibly empty) parameter
     * list. Does not handle the enclosing
     * parentheses tokens ( and ).
     */
  }

  compileSubroutineBody(): void {
    /** Compiles a subroutine's body. */
  }

  compileVarDec(): void {
    /** Compiles a var declaration. */
  }

  compileStatements(): void {
    /** Compiles a sequence of statements.
     * Does not handle the enclosing curly
     * bracket tokens { and }
     */
  }

  compileLet(): void {
    /** Compiles a let statement */
  }

  compileIf(): void {
    /** Compiles an if statement,
     * possibly with a trailing else clause.
     */
  }

  compileWhile(): void {
    /** Compiles a while statement. */
  }

  compileDo(): void {
    /** Compiles a do statement. */
  }

  compileReturn(): void {
    /** Compiles a return statement. */
  }

  compileExpression(): void {
    /** Compiles an expression. */
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
  }

  compileExpressionList(): void {
    /** Compiles a (possibly empty) comma-
     * separated list of expressions. Returns
     * the number of expressions in the list.
     */
  }
}
