const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/crist/OneDrive/Desktop/ANTI PRO/backend/src/controllers';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
  let p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf-8');

  // Fix { key: parseInt( as string) }
  c = c.replace(/([a-zA-Z0-9_]+)\s*:\s*parseInt\(\s*as string\)/g, '$1: parseInt($1 as string)');
  
  // Fix key ? parseInt( as string)
  c = c.replace(/([a-zA-Z0-9_]+)\s*\?\s*parseInt\(\s*as string\)/g, '$1 ? parseInt($1 as string)');

  // Fix { where: { id: parseInt( as string) } } - but wait, the key is 'id' so it's already caught by the first regex!
  
  // Any leftover bare ones, we'll assume it's `id`
  c = c.replace(/parseInt\(\s*as string\)/g, 'parseInt(id as string)');

  // Remove duplicate `as string as string`
  c = c.replace(/as string as string/g, 'as string');

  fs.writeFileSync(p, c);
});
