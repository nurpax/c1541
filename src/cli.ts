#!/usr/bin/env node

const version = require('../package.json').version;
const program = require('commander');

import * as fs from 'fs'
import { readDirectory, petsciiToScreen } from './'

type Pix = { code: number, color: number };

const screenToPetscii = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  screenToPetscii[petsciiToScreen(i)] = i;
}

program
  .description("C64 c1541 directory filename editor")
  .usage('[options] <input.d64> <output.d64>')
  .option('--petmate <path>', 'source .petmate file to use as dir art -- uses the first screen in the file')
  .version(version)
  .parse(process.argv);

if (program.args.length !== 2) {
  console.error('Must specify <input.d64> <output.d64> files');
  process.exit(1);
}

if (!program.petmate) {
  console.error('Must specify .petmate file for dir art using --petmate <file>');
  process.exit(1);
}

const petmate = fs.readFileSync(program.petmate).toString();
const screencodes: number[][] =
  JSON.parse(petmate).framebufs[0].framebuf.map((row: Pix[]) => {
    return row.map((p: Pix) => p.code);
  });

// TODO
// --overwrite
//  only one args input can be given, will modify this d64 file in-place
// otherwise require src dst d64 in args

const d64bin = fs.readFileSync(program.args[0]);
const dirEntries = readDirectory(d64bin);

let newDirnames = screencodes;
for (let i = 0; i < dirEntries.length; i++) {
  const d = newDirnames[i].map(p => screenToPetscii[p]);
  const pet = new Uint8Array(16);
  pet.fill(0x20);
  pet.set(d, 0);
  d64bin.set(pet, dirEntries[i].d64FileOffset);

  // TODO add option to fill the rest of the entries with just empty?
  if (i >= newDirnames.length-1) {
    break;
  }
}

const outFile = program.args[1];
fs.writeFileSync(outFile, d64bin);
console.log('Modified .d64 file written in', outFile);
