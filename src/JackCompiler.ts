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

filesToTranslate.forEach((filePath: string) => {
  const fileName = filePath.split(/(.+)(.jack)/)[1];
  const writeFilePath = path.resolve(fileName + "TT.xml");

  const tokenizer = new JackTokenizer(filePath);
  const compEngine = new CompilationEngine(tokenizer, writeFilePath);
  compEngine.compileClass();
});
