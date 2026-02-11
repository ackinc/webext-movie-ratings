import * as fs from "node:fs";

const file1 = process.argv[2];
const file2 = process.argv[3];

const catalog1 = new Set(fs.readFileSync(file1, "utf-8").split("\n"));
const catalog2 = new Set(fs.readFileSync(file2, "utf-8").split("\n"));

const intersection = new Set([...catalog1].filter((x) => catalog2.has(x)));
const intersectionPerc = Math.round((intersection.size / catalog1.size) * 100);
console.log(`Sizes: ${catalog1.size}, ${catalog2.size}`);
console.log(`Intersection: ${intersection.size} (${intersectionPerc}%)`);
