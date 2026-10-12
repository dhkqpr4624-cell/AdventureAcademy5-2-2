import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
globalThis.window = { setTimeout, clearTimeout };
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aa-final-checks-'));
try {
 await build({entryPoints:['src/runAllChecks.ts'],outfile:path.join(temp,'checks.mjs'),bundle:true,platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify({BASE_URL:'/AdventureAcademy5-2-2/',DEV:false,PROD:true})},loader:{'.png':'file','.txt':'text'},assetNames:'assets/[name]-[hash]'});
 await import(pathToFileURL(path.join(temp,'checks.mjs')));
} finally {fs.rmSync(temp,{recursive:true,force:true});}
