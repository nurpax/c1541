import { readDirectory } from '../index';

import * as fs from 'fs';

test('read d64 file listing', () => {
    const d64 = fs.readFileSync('./d64/hrmu-visio2018.d64');
    const entries = readDirectory(d64);
    expect(entries.length).toBe(14);
    const de0 = entries[0];
    expect(de0.type).toBe('prg');
    expect(de0.petsciiName.toString()).toBe('VISIO2018 /HIRMU');
    expect(de0.screencodeName[0]).toBe(0x16); // V
    expect(de0.screencodeName[1]).toBe(0x09); // I
    expect(de0.screencodeName[2]).toBe(0x13); // S
    expect(de0.screencodeName[3]).toBe(0x09); // I
    const de1 = entries[1];
    expect(de1.type).toBe('del');
    const de2 = entries[2];
    expect(de2.type).toBe('del');
});
