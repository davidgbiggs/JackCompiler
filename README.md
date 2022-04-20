# JackCompiler

Compiler for the Jack programming language.
Usage:

1. Ensure [Node is installed on your computer](https://nodejs.org/en/download/).
2. Ensure TypeScript is installed on your computer by running `npm install typescript -g`
3. Navigate to the `src` directory, and run `tsc`
4. Navigate to the newly created `dist` directory.
5. Run `node JackCompiler.js <Path-to-Jack-File>` to compile your Jack program into VM code.
6. You can use the `samples` directory to inspect the JackCompiler without any Jack code of your own.

This project passes all tests provided by the Nand2Tetris course on Coursera.
