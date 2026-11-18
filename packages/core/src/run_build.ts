import { runPipeline } from "./pipeline.ts";

export const runBuild = async () => {
  return await runPipeline("build");
};
