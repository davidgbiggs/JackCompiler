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
