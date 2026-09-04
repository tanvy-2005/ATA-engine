const fs = require('fs');
let code = fs.readFileSync('src/pages/runs/RunListPage.tsx', 'utf8');

const regex = /<motion\.div([^>]*?onClick=\{\(\) => handleOpenDrawer\('([^']+)'\)\}[^>]*?title="([^"]+)"[^>]*)>([\s\S]*?)<\/motion\.div>/g;

let count = 0;
code = code.replace(regex, (match, attrs, drawerName, titleText, content) => {
    count++;
    let cleanAttrs = attrs.replace(/\s*title="[^"]+"/, '');
    
    return `<TooltipProvider>
                                                <Tooltip delayDuration={100}>
                                                    <TooltipTrigger asChild>
                                                        <motion.div${cleanAttrs}>${content}</motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        ${titleText}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>`;
});

// Fix bg-black/35 for light mode support
code = code.replace(/bg-black\/35/g, 'bg-slate-100 dark:bg-black/35');

fs.writeFileSync('src/pages/runs/RunListPage.tsx', code);
console.log('Replaced ' + count + ' tooltips successfully');
