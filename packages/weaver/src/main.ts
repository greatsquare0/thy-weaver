#!/usr/bin/env node

import { loadConfig } from "./config_handler.ts";

console.log((await loadConfig())?.config);

process.exit(0);
