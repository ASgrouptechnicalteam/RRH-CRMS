const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'apps', 'api', 'src', 'server.ts');
let content = fs.readFileSync(serverFile, 'utf8');

if (!content.includes('import compression')) {
  content = content.replace("import { PortalWorker } from './services/portalWorker';", "import { PortalWorker } from './services/portalWorker';\nimport compression from 'compression';");
}

if (!content.includes('app.use(compression())')) {
  content = content.replace("app.use(cookieParser());", "app.use(cookieParser());\napp.use(compression());");
}

fs.writeFileSync(serverFile, content, 'utf8');
console.log('Added compression to server.ts');
