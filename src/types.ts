type TokenType =
  | "keyword"
  | "symbol"
  | "int_const"
  | "string_const"
  | "identifier";

type KeyWord =
  | "class"
  | "method"
  | "function"
  | "constructor"
  | "int"
  | "boolean"
  | "char"
  | "void"
  | "var"
  | "static"
  | "field"
  | "let"
  | "do"
  | "if"
  | "else"
  | "while"
  | "return"
  | "true"
  | "false"
  | "null"
  | "this";

type JackSymbol =
  | "{"
  | "}"
  | "("
  | ")"
  | "["
  | "]"
  | "."
  | ","
  | ";"
  | "+"
  | "-"
  | "*"
  | "/"
  | "&"
  | "|"
  | "<"
  | ">"
  | "="
  | "~";

interface JackMap {
  [key: string]: boolean;
}

interface opToVMMap {
  [key: string]: VMOperation;
}

interface SymbolMap {
  [key: string]: SymbolEntry;
}

type SymbolEntry = {
  type: string;
  kind: SymbolKind;
  index: number;
};

type SymbolKind = "static" | "field" | "arg" | "var";

type VMSegment =
  | "constant"
  | "argument"
  | "local"
  | "static"
  | "this"
  | "that"
  | "pointer"
  | "temp";

type VMOperation =
  | "add"
  | "sub"
  | "neg"
  | "eq"
  | "lt"
  | "and"
  | "or"
  | "not"
  | "gt";
