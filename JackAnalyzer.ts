import fs from "fs";
import path from "path";
const readFileName = process.argv[2];
import JackTokenizer from "./JackTokenizer";
import CompilationEngine from "./CompilationEngine";

// @ts-ignore
const absolutePath = path.resolve(process.env.PWD, readFileName);

const filesToTranslate = [];
let isDirectory = null;

if (fs.existsSync(absolutePath) && fs.lstatSync(absolutePath).isDirectory()) {
  isDirectory = true;
  const files = fs.readdirSync(absolutePath);
  files.forEach((file) => {
    if (path.extname(file) === ".jack") {
      if (process.env.PWD) {
        filesToTranslate.push(path.resolve(absolutePath, file));
      } else {
        throw new Error("PWD Issue");
      }
    }
  });
} else {
  isDirectory = false;
  filesToTranslate.push(absolutePath);
}

function writeCurrentFile(tokenizer: JackTokenizer): string[] {
  const newCommands: string[] = [];
  do {
    tokenizer.advance();
    if (tokenizer.tokenType() === "keyword") {
      newCommands.push(`<keyword> ${tokenizer.keyWord()} </keyword>`);
    } else if (tokenizer.tokenType() === "symbol") {
      newCommands.push(`<symbol> ${tokenizer.symbol()} </symbol>`);
    } else if (tokenizer.tokenType() === "identifier") {
      newCommands.push(`<identifier> ${tokenizer.identifier()} </identifier>`);
    } else if (tokenizer.tokenType() === "int_const") {
      newCommands.push(
        `<integerConstant> ${tokenizer.intVal()} </integerConstant>`
      );
    } else if (tokenizer.tokenType() === "string_const") {
      newCommands.push(
        `<stringConstant> ${tokenizer.stringVal()} </stringConstant>`
      );
    }
  } while (tokenizer.hasMoreTokens());
  return newCommands;
}

filesToTranslate.forEach((filePath: string) => {
  const fileName = filePath.split(/(.+)(.jack)/)[1];
  const writeFilePath = path.resolve(fileName + "TT" + ".xml");

  //   const compEngine = new CompilationEngine(filePath, writeFilePath);
  const tokenizer = new JackTokenizer(filePath);
  const newCommands = writeCurrentFile(tokenizer);

  fs.writeFile(
    writeFilePath,
    "<tokens>\n" + newCommands.join("\n") + "\n</tokens>",
    (err) => {
      if (err) {
        console.error(err);
        return;
      } else {
        // console.log("file written");
      }
    }
  );
});
