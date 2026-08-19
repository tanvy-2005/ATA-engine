const fs = require('fs');
const path = require('path');

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function run() {
  const files = await getFiles(path.join(__dirname, 'src'));
  const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  for (const file of tsxFiles) {
    let content = await fs.promises.readFile(file, 'utf8');
    let original = content;

    if (file.endsWith('App.tsx')) {
      content = content.replace(/<Route path="\/dashboard" element={<DashboardShell \/>}>/, '<Route element={<DashboardShell />}>');
      content = content.replace(/<Route index element={<Navigate to="workspaces" replace \/>} \/>/g, '<Route path="/dashboard" element={<Navigate to="/workspaces" replace />} />');
    } else {
      // Don't replace "/dashboard" blindly in App.tsx routing paths unless it's a redirect, but we did that manually above.
    }

    // Replace "/dashboard/..." with "/..."
    content = content.replace(/\/dashboard\//g, '/');

    // Replace strict "/dashboard" with "/workspaces"
    content = content.replace(/"\/dashboard"/g, '"/workspaces"');
    content = content.replace(/'\/dashboard'/g, "'/workspaces'");
    content = content.replace(/`\/dashboard`/g, "`/workspaces`");

    if (content !== original) {
      await fs.promises.writeFile(file, content, 'utf8');
      console.log('Updated', file);
    }
  }
}

run().catch(console.error);
