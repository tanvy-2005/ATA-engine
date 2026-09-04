const fs = require('fs');
let code = fs.readFileSync('src/pages/runs/RunListPage.tsx', 'utf8');

// 1. Fix tooltips robustly
// Only match motion.div that have handleOpenDrawer and a title attribute
const regex = /<motion\.div([^>]*?handleOpenDrawer[^>]*?)title="([^"]+)"\s*>([\s\S]*?)<\/motion\.div>/g;
code = code.replace(regex, (match, before, title, inside) => {
    return `<TooltipProvider>\n<Tooltip delayDuration={100}>\n<TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">\n<motion.div${before}>\n${inside}\n</motion.div>\n</TooltipTrigger>\n<TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px] z-50">\n${title}\n</TooltipContent>\n</Tooltip>\n</TooltipProvider>`;
});
code = code.replace(/bg-black\/35/g, 'bg-slate-100 dark:bg-black/35');

// 2. Remove emojis
code = code.replace(/🗺️ Flowchart/g, 'Flowchart');
code = code.replace(/🧩 Modules/g, 'Modules');
code = code.replace(/🎯 Strategy/g, 'Strategy');
code = code.replace(/💾 Test Data/g, 'Test Data');

// 3. Fix drawer UI
code = code.replace(/text-cyan-300/g, 'text-cyan-700 dark:text-cyan-300');
code = code.replace(/text-rose-300/g, 'text-rose-700 dark:text-rose-300');
code = code.replace(/text-emerald-300/g, 'text-emerald-700 dark:text-emerald-300');
code = code.replace(/text-amber-300/g, 'text-amber-700 dark:text-amber-300');
code = code.replace(/text-purple-300/g, 'text-purple-700 dark:text-purple-300');
code = code.replace(/text-indigo-300/g, 'text-indigo-700 dark:text-indigo-300');
code = code.replace(/text-blue-300/g, 'text-blue-700 dark:text-blue-300');
code = code.replace(/text-rose-400/g, 'text-rose-600 dark:text-rose-400');
// skip text-cyan-400 and text-emerald-400

// Fix scrollbar in the terminal drawer
code = code.replace(/max-h-\[220px\] overflow-y-auto bg-\[#07080b\]\/90/g, 'max-h-[220px] overflow-y-auto bg-[#07080b]/90 hide-scrollbar');

// 4. Fix System Logs header color
code = code.replace(
    /<span className="text-xs font-quicksand uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold">\s*System Logs &amp; Activity/g,
    `<span className="text-xs font-quicksand uppercase tracking-wider text-slate-300 font-bold">\n                                                            System Logs &amp; Activity`
);

// 5. Fix getNodeStyles
const oldGetNodeStyles = `    const getNodeStyles = (status: 'idle' | 'running' | 'success' | 'failure' | 'completed' | string) => {
        const base = "w-44 p-4 rounded-2xl cursor-pointer text-center relative group shadow-[0_5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl border-2 transition-all duration-500 [transform-style:preserve-3d] ";
        if (status === 'running') {
            return base + "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] dark:shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-float-node scale-102";
        }
        if (status === 'success' || status === 'completed') {
            return base + "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-400 dark:border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)] dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-float-node";
        }
        if (status === 'failure') {
            return base + "bg-rose-50 dark:bg-rose-500/5 border-rose-400 dark:border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.1)] dark:shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-float-node";
        }
        return base + "bg-white/90 dark:bg-[#0c0d1b]/70 border-slate-200 dark:border-white/5 opacity-80 dark:opacity-40 hover:opacity-100 dark:hover:opacity-75 hover:scale-102";
    };`;
const newGetNodeStyles = `    const getNodeStyles = (status: 'idle' | 'running' | 'success' | 'failure' | 'completed' | string) => {
        const base = "w-44 p-4 rounded-3xl cursor-pointer text-center relative group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl border-2 transition-all duration-500 [transform-style:preserve-3d] bg-white dark:bg-[#0c0d1b]/90 ";
        if (status === 'running') {
            return base + "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] dark:shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-float-node scale-[1.02]";
        }
        if (status === 'success' || status === 'completed') {
            return base + "border-emerald-400 dark:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-float-node";
        }
        if (status === 'failure') {
            return base + "border-rose-400 dark:border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)] dark:shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-float-node scale-[1.02]";
        }
        return base + "border-slate-100 dark:border-white/5 opacity-90 dark:opacity-40 hover:opacity-100 dark:hover:opacity-75 hover:scale-[1.02] hover:border-slate-200";
    };`;
code = code.replace(oldGetNodeStyles, newGetNodeStyles);

// 6. Fix horizontal scrolling and min-width for the graph
code = code.replace(
    /<div className="flex-1 flex flex-col justify-center items-center p-6 overflow-hidden relative min-h-0 h-full">/g,
    '<div className="flex-1 flex flex-col justify-center items-center p-6 overflow-x-auto overflow-y-hidden relative min-h-0 h-full hide-scrollbar">'
);
code = code.replace(
    /<div className="w-full max-w-4xl h-full max-h-\[450px\] relative flex items-center justify-center bg-white\/60 dark:bg-\[#0E101D\]\/40 border border-slate-200 dark:border-cyan-500\/10 rounded-3xl p-8 backdrop-blur-2xl shadow-sm dark:shadow-none">/g,
    '<div className="min-w-[950px] w-full max-w-5xl h-full max-h-[450px] relative flex items-center justify-center bg-white/60 dark:bg-[#0E101D]/40 border border-slate-200 dark:border-cyan-500/10 rounded-3xl p-8 backdrop-blur-2xl shadow-sm dark:shadow-none">'
);

fs.writeFileSync('src/pages/runs/RunListPage.tsx', code);
console.log('Applied all robust fixes successfully.');
