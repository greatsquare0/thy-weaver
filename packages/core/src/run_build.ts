import { runPipeline } from "./pipeline.ts";

export const runBuild = async () => {
  const result = await runPipeline("build");

  // Let CI and scripts notice a failed build
  if (result.html === undefined) process.exitCode = 1;

  return result;
};
