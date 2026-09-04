const fs = require('fs');
let code = fs.readFileSync('src/pages/runs/RunListPage.tsx', 'utf8');
code = code.replace(/🗺️ Flowchart/g, 'Flowchart');
code = code.replace(/🧩 Modules/g, 'Modules');
code = code.replace(/🎯 Strategy/g, 'Strategy');
code = code.replace(/💾 Test Data/g, 'Test Data');
fs.writeFileSync('src/pages/runs/RunListPage.tsx', code);
console.log('Removed emojis successfully.');
