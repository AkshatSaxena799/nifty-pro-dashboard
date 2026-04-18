import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src')
];

function processContent(content) {
  // Specifically map all currently used dark day-mode greens to the exact #06402b hex.
  // We use negative lookbehinds to ensure it doesn't accidentally overwrite a dark: definition.
  
  content = content.replace(/(?<!dark:|\-)text-green-(800|900|950)/g, 'text-[#06402b]');
  content = content.replace(/(?<!dark:|\-)text-emerald-(700|800|900|950)/g, 'text-[#06402b]');

  return content;
}

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'hooks' && file !== 'utils') walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let original = fs.readFileSync(fullPath, 'utf8');
      let modified = processContent(original);

      if (original !== modified) {
        fs.writeFileSync(fullPath, modified, 'utf8');
        console.log('Patched custom hex color #06402b in', fullPath);
      }
    }
  }
}

for (const dir of dirs) {
  walk(dir);
}
console.log('Done injecting custom #06402b into day theme text.');
