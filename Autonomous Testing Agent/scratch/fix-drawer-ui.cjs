const fs = require('fs');
let code = fs.readFileSync('src/pages/runs/RunListPage.tsx', 'utf8');

// Fix text colors in drawer cards for light mode visibility
code = code.replace(/text-cyan-300/g, 'text-cyan-700 dark:text-cyan-300');
code = code.replace(/text-rose-300/g, 'text-rose-700 dark:text-rose-300');
code = code.replace(/text-emerald-300/g, 'text-emerald-700 dark:text-emerald-300');
code = code.replace(/text-amber-300/g, 'text-amber-700 dark:text-amber-300');
code = code.replace(/text-purple-300/g, 'text-purple-700 dark:text-purple-300');
code = code.replace(/text-indigo-300/g, 'text-indigo-700 dark:text-indigo-300');
code = code.replace(/text-blue-300/g, 'text-blue-700 dark:text-blue-300');

// Fix text-rose-400 for localization report title
code = code.replace(/text-rose-400/g, 'text-rose-600 dark:text-rose-400');
code = code.replace(/text-cyan-400/g, 'text-cyan-600 dark:text-cyan-400');
code = code.replace(/text-emerald-400/g, 'text-emerald-600 dark:text-emerald-400');

// Fix scrollbar in the terminal drawer
code = code.replace(/max-h-\[220px\] overflow-y-auto bg-\[#07080b\]\/90/g, 'max-h-[220px] overflow-y-auto bg-[#07080b]/90 hide-scrollbar');

fs.writeFileSync('src/pages/runs/RunListPage.tsx', code);
console.log('Fixed UI issues in light mode for drawer nodes.');
