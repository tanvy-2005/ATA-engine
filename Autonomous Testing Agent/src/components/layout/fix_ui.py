import re

with open(r'd:\Autonomous Testing Agent ATA\Autonomous Testing Agent\src\components\layout\AuthLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Tooltip wrappers but keep the motion.div
# Match <TooltipProvider>...<TooltipTrigger...><motion.div
# to just <motion.div
content = re.sub(r'<TooltipProvider>\s*<Tooltip>\s*<TooltipTrigger[^>]*>\s*(<motion\.div[^>]*>)', r'\1', content)

# Match </motion.div>\s*</TooltipTrigger>\s*<TooltipContent[^>]*>.*?</TooltipContent>\s*</Tooltip>\s*</TooltipProvider>
# to just </motion.div>
content = re.sub(r'(</motion\.div>)\s*</TooltipTrigger>\s*<TooltipContent[^>]*>.*?</TooltipContent>\s*</Tooltip>\s*</TooltipProvider>', r'\1', content, flags=re.DOTALL)

# 2. Remove "Click for details" texts
content = re.sub(r'<p className="text-\[9px\][^>]*>Click for details</p>', '', content)

# 3. Fix the squished UI layout
# Scale down boxes slightly to fit the layout width
content = content.replace('w-[180px] h-[100px]', 'w-[150px] h-[90px]')
content = content.replace('p-8 z-10 w-full h-full', 'p-4 z-10 w-full h-full gap-4')

# 4. Remove max-w-[700px] from the motion.div wrapper so it can breathe
content = content.replace('className="w-full max-w-[700px] h-[300px] relative hidden md:block"', 'className="w-full h-[280px] relative hidden md:block"')

# 5. Fix text overflow by making progress and time text smaller
content = content.replace('text-[10px] font-quicksand text-slate-500', 'text-[9px] font-quicksand text-slate-500 w-full')

# 6. Change col gap
content = content.replace('grid-cols-4 grid-rows-2', 'grid-cols-4 grid-rows-2 gap-x-2 gap-y-6')

with open(r'd:\Autonomous Testing Agent ATA\Autonomous Testing Agent\src\components\layout\AuthLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Fixed")
