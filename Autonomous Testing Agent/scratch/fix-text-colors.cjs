const fs = require('fs');
let code = fs.readFileSync('src/pages/runs/RunListPage.tsx', 'utf8');

// Fix Drawer Terminal Logs
code = code.replace(
    /text-rose-600 dark:text-rose-600 dark:text-rose-400 font-semibold' : log\.type === 'warn' \? 'text-amber-400' : log\.type === 'success' \? 'text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300'/g,
    "text-rose-400 font-semibold' : log.type === 'warn' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400 font-medium' : 'text-slate-300'"
);

// Fix Main Sidebar Terminal Logs
code = code.replace(
    /text-rose-500 dark:text-rose-600 dark:text-rose-600 dark:text-rose-400 font-semibold' : log\.type === 'warn' \? 'text-amber-500 dark:text-amber-400' : log\.type === 'success' \? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300'/g,
    "text-rose-400 font-semibold' : log.type === 'warn' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400 font-medium' : 'text-slate-300'"
);

// Fix fixed dark background elements in drawers that mistakenly use text-slate-700 dark:text-slate-300
code = code.replace(
    /bg-slate-900\/60([\s\S]*?)text-slate-700 dark:text-slate-300/g,
    "bg-slate-900/60$1text-slate-300"
);

fs.writeFileSync('src/pages/runs/RunListPage.tsx', code);
console.log('Fixed log text colors and drawer UI elements with fixed dark backgrounds.');
