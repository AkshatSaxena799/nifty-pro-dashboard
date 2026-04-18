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
  // 1. Convert any ultra-dark greens we injected (or standard greens) into a vibrant but readable "Forest Green" (green-800 -> #166534).
  content = content.replace(/text-green-950/g, 'text-green-800');
  content = content.replace(/text-green-900/g, 'text-green-800');
  
  // 2. Yellow day-theme texts to dark blue. 
  // Map any yellow/amber that isn't already dark: prefixed to dark blue for day mode, 
  // while appending the original as the dark mode variant.
  
  // Clean up any weird leftovers from previous patches first
  content = content.replace(/text-yellow-900/g, 'text-blue-900');
  content = content.replace(/text-amber-900/g, 'text-blue-900');

  // Match native text-yellow-XXX or text-amber-XXX
  content = content.replace(/(?<!dark:|\-)text-yellow-([0-9]{3})/g, (match) => {
    return `text-blue-900 dark:${match}`;
  });
  
  content = content.replace(/(?<!dark:|\-)text-amber-([0-9]{3})/g, (match) => {
    return `text-blue-900 dark:${match}`;
  });

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
        console.log('Patched aesthetics colors in', fullPath);
      }
    }
  }
}

for (const dir of dirs) {
  walk(dir);
}
console.log('Done tweaking day theme aesthetics.');
