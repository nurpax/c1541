#!/usr/bin/env node

const version = require('../package.json').version;
const program = require('commander');

import * as fs from 'fs'
import { readDirectory, petsciiToScreen } from './'

type Pix = { code: number, color: number };

function reshape2d(flat: number[], width: number, height: number): number[][] {
  const arr2d = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(flat[x + width*y]);
    }
    arr2d.push(row);
  }
  return arr2d;
}

const screenToPetscii = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  screenToPetscii[petsciiToScreen(i)] = i;
}

program
  .description("C64 c1541 directory filename editor")
  .usage('[options] <input.d64> <output.d64>')
  .option('--petmate <path>', 'source .petmate file to use as dir art -- uses the first screen in the file')
  .option('--json <path>', 'Petmate .json exported file to use as dir art -- uses the first screen in the file')
  .version(version)
  .parse(process.argv);

if (program.args.length !== 2) {
  console.error('Must specify <input.d64> <output.d64> files');
  process.exit(1);
}

if (!program.petmate && !program.json) {
  console.error('Must specify either .petmate or .json file for dir art using --petmate <file> or --json <file>');
  process.exit(1);
}

let screencodes: number[][] | null = null;

if (program.petmate && program.json) {
  console.error('only --petmate or --json should be used.  now both specified')
  process.exit(1);
}

if (program.petmate) {
  const petmate = fs.readFileSync(program.petmate).toString();
  screencodes =
    JSON.parse(petmate).framebufs[0].framebuf.map((row: Pix[]) => {
      return row.map((p: Pix) => p.code);
    });
} else if (program.json) {
  const json = JSON.parse(fs.readFileSync(program.json).toString());
  const fb = json.framebufs[0];
  const w = fb.width;
  const h = fb.height;
  if (w != 16) {
    console.warn('warning: dirart should be 16 chars wide.  truncating to 16 chars.');
  }
  screencodes = reshape2d(fb.screencodes, w, h);
}

// TODO
// --overwrite
//  only one args input can be given, will modify this d64 file in-place
// otherwise require src dst d64 in args

const d64bin = fs.readFileSync(program.args[0]);
const dirEntries = readDirectory(d64bin);

let newDirnames = screencodes!;
for (let i = 0; i < dirEntries.length; i++) {
  const d = newDirnames[i].map(p => screenToPetscii[p]);
  const pet = new Uint8Array(16);
  pet.fill(0x20);
  pet.set(d.slice(0, 16), 0);
  d64bin.set(pet, dirEntries[i].d64FileOffset);

  // TODO add option to fill the rest of the entries with just empty?
  if (i >= newDirnames.length-1) {
    break;
  }
}

const outFile = program.args[1];
fs.writeFileSync(outFile, d64bin);
console.log('Modified .d64 file written in', outFile);
