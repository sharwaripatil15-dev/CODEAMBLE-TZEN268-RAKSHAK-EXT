import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootAssetsDir = path.resolve(__dirname, '../assets');
const distAssetsDir = path.resolve(__dirname, '../dist/assets');

if (!fs.existsSync(rootAssetsDir)) {
  fs.mkdirSync(rootAssetsDir, { recursive: true });
}
if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
}

// 1x1 Cyan pixel base64 PNG
const cyanPngBase64 = 'iVBORw0KGgoAAAANSU56NTAKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOUERdVk4AAAAIAAAAAQAAAAEBAAAAABtFv8AAAAANSURBVBhXY/jPw/A/AAUBAPB/AWoAAAAASUVORK5CYII=';

const iconBuffer = Buffer.from(cyanPngBase64, 'base64');

['icon16.png', 'icon48.png', 'icon128.png'].forEach((iconName) => {
  fs.writeFileSync(path.join(rootAssetsDir, iconName), iconBuffer);
  fs.writeFileSync(path.join(distAssetsDir, iconName), iconBuffer);
});

console.log('✅ Generated Chrome Extension icons in both assets/ and dist/assets/');
