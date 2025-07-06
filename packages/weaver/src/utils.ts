import { resolve } from "node:path";
import { cwd } from "node:process";

export const tempFolderPath = () => {
  return resolve(cwd(), "node_modules", ".lib-weaver-temp");
};
