import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.resolve(__dirname, '../dist/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 Cyan pixel base64 PNG
const cyanPngBase64 = 'iVBORw0KGgoAAAANSU56NTAKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOUERdVk4AAAAIAAAAAQAAAAEBAAAAABtFv8AAAAANSURBVBhXY/jPw/A/AAUBAPB/AWoAAAAASUVORK5CYII=';

fs.writeFileSync(path.join(assetsDir, 'icon16.png'), Buffer.from(cyanPngBase64, 'base64'));
fs.writeFileSync(path.join(assetsDir, 'icon48.png'), Buffer.from(cyanPngBase64, 'base64'));
fs.writeFileSync(path.join(assetsDir, 'icon128.png'), Buffer.from(cyanPngBase64, 'base64'));

console.log('✅ Generated Chrome Extension icons in dist/assets/');
