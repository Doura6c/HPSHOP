// Extrait le tableau `produits` de index.html → JSON + CSV pour Google Sheets
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../index.html', 'utf8').split('\n');
// Le tableau va de `const produits=[` (2005) à `];` (2035) — indices 0-based 2004..2034
const start = src.findIndex(l => l.includes('const produits=['));
let end = -1;
for (let i = start; i < src.length; i++) { if (/^\];/.test(src[i])) { end = i; break; } }
const block = src.slice(start, end + 1).join('\n');
const produits = eval('(function(){' + block.replace('const produits=', 'return ') + '})()');

fs.writeFileSync(__dirname + '/produits.json', JSON.stringify(produits, null, 2));

const COLS = ['id','nom','cat','emoji','prix','old','stock','badge','desc','img','imgs','pub','usage','video'];
const SEP = ' | ';
const cell = v => {
  if (Array.isArray(v)) v = v.join(SEP);
  if (typeof v === 'boolean') v = v ? 'TRUE' : 'FALSE';
  v = (v === undefined || v === null) ? '' : String(v);
  return '"' + v.replace(/"/g, '""') + '"';
};
const lines = [COLS.map(c => '"' + c + '"').join(',')];
for (const p of produits) lines.push(COLS.map(c => cell(p[c])).join(','));
fs.writeFileSync(__dirname + '/produits-seed.csv', lines.join('\n'));

console.log('Produits extraits :', produits.length);
console.log('Catégories :', [...new Set(produits.map(p => p.cat))].join(', '));
console.log('Fichiers : admin/produits.json, admin/produits-seed.csv');
