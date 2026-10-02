const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexPath)) {
  // 1. Create fallback 404.html for static servers
  fs.copyFileSync(indexPath, path.join(distDir, '404.html'));

  // 2. Pre-generate directory index.html files for direct route hits
  const routes = ['admin', 'ADMIN', 'team', 'attend', 'volunteer', 'review', 'problem-statements'];
  routes.forEach(route => {
    const routeDir = path.join(distDir, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(indexPath, path.join(routeDir, 'index.html'));
  });

  console.log('[Postbuild] Successfully created 404.html and route fallback directories for SPA direct navigation.');
}
