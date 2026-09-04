const fs = require('fs');
let c = fs.readFileSync('src/pages/runs/RunListPage.tsx', 'utf8');
c = c.replace(/<Tooltip delayDuration=\{\d+\}>/g, '<Tooltip>');
c = c.replace(/<TooltipTrigger asChild>/g, '<TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">');
fs.writeFileSync('src/pages/runs/RunListPage.tsx', c);
console.log('Done!');
