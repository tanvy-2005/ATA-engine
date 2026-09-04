with open('grid_block_temp.txt', 'r', encoding='utf-8') as f:
    grid_block = f.read()

with open('AuthLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_import = 'import { Globe, Code2, Search, ShieldAlert, BrainCircuit, Bug, Check, Bot } from \'lucide-react\';'
new_import = 'import { Globe, Code2, Search, ShieldAlert, BrainCircuit, Bug, Check, Bot, Layers, Cpu, Layers3, ShieldCheck, FileText, Code } from \'lucide-react\';'

content = content.replace(old_import, new_import)

start_str = '{/* Feature Cards */}'
end_str = '        </div>\n\n        {/* RIGHT SIDE (45%) */}'
if start_str in content:
    pre_content = content[:content.find(start_str)]
    post_content = content[content.find(end_str):]
    
    wrapper = '''          {/* Pipeline Node Graph */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-[700px] h-[300px] relative hidden md:block"
          >
''' + grid_block + '''          </motion.div>\n'''
    
    final_content = pre_content + wrapper + post_content
    with open('AuthLayout.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print('SUCCESS replaced')
else:
    print('COULD NOT FIND BLOCK')
