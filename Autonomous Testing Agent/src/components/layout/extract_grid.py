import re

with open(r'd:\Autonomous Testing Agent ATA\Autonomous Testing Agent\src\pages\runs\RunListPage.tsx', 'r', encoding='utf-8') as f:
    runlist_content = f.read()

start_str = '{/* 3D Viewport-Constrained Topology Graph Grid */}'
end_str = '{/* ---------------------------------------------------- */}'
if start_str in runlist_content:
    grid_block = runlist_content[runlist_content.find(start_str):]
    grid_block = grid_block[:grid_block.find('</div>\n                                </div>\n') + 6]
    
    grid_block = grid_block.replace('agentStatuses.planner !== \'idle\'', 'true')
    grid_block = grid_block.replace('agentStatuses.explorer !== \'idle\'', 'true')
    grid_block = grid_block.replace('agentStatuses.generator !== \'idle\'', 'true')
    grid_block = grid_block.replace('agentStatuses.executor !== \'idle\'', 'true')
    grid_block = grid_block.replace('agentStatuses.memory !== \'idle\'', 'true')
    grid_block = grid_block.replace('agentStatuses.validator !== \'idle\'', 'true')
    grid_block = grid_block.replace('agentStatuses.bug_analyzer !== \'idle\'', 'true')
    
    grid_block = re.sub(r'onClick=\{[^\}]+\}', '', grid_block)
    
    static_style = '"relative group w-[180px] h-[100px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"'
    grid_block = re.sub(r'className=\{getNodeStyles\([^\)]+\)\}', 'className=' + static_style, grid_block)
    
    # Simple replacement for dynamic dot
    grid_block = re.sub(r'className=\{`inline-block[^`]+`\}', 'className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"', grid_block)
    
    grid_block = re.sub(r'\{nodeProgress\.planner\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.explorer\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.generator\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.executor\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.memory\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.validator\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.bug_analyzer\}', '100', grid_block)
    grid_block = re.sub(r'\{nodeProgress\.reporter\}', '100', grid_block)

    grid_block = re.sub(r'\{nodeTimers\.planner\}', '44', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.explorer\}', '39', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.generator\}', '26', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.executor\}', '0', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.memory\}', '22', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.validator\}', '0', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.bug_analyzer\}', '111', grid_block)
    grid_block = re.sub(r'\{nodeTimers\.reporter\}', '22', grid_block)

    with open('grid_block_temp.txt', 'w', encoding='utf-8') as f:
        f.write(grid_block)
    print('SUCCESS')
