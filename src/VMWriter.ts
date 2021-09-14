import fs from "fs";

export class VMWriter {
  writeFilePath: string;
  newCommands: string[];

  constructor(_writeFilePath: string) {
    this.writeFilePath = _writeFilePath;
    this.newCommands = [];
  }

  add(command: string) {
    this.newCommands.push(command);
  }

  writePush(segment: VMSegment | "none", index: number) {
    this.add(`push ${segment} ${index}`);
  }

  writePop(segment: VMSegment, index: number) {
    this.add(`pop ${segment} ${index}`);
  }

  writeArithmetic(command: VMOperation) {
    this.add(`${command}`);
  }

  writeLabel(label: string) {
    this.add(`label ${label}`);
  }

  writeGoto(label: string) {
    this.add(`goto ${label}`);
  }

  writeIf(label: string) {
    this.add(`if-goto ${label}`);
  }

  writeCall(name: string, nArgs: number) {
    this.add(`call ${name} ${nArgs}`);
  }

  writeFunction(name: string, nVars: number) {
    this.add(`function ${name} ${nVars}`);
  }

  writeReturn() {
    this.add(`return`);
  }

  close() {
    fs.writeFile(this.writeFilePath, this.newCommands.join("\n"), (err) => {
      if (err) {
        console.error(err);
        return;
      } else {
        console.log(`${this.writeFilePath} written`);
      }
    });
  }
}
