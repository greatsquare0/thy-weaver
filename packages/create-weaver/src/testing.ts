import { readdir } from "node:fs/promises";
process.chdir("./packages/create-weaver/");

const dir = await readdir("./template/");
console.log(dir);
