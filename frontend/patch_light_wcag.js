import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(__dirname, 'src', 'components')
];

const replacements = {
  // Correcting the overly light text in Day Mode specifically for green/blue/cyan
  'text-neon-cyan': 'text-cyan-700 dark:text-neon-cyan',
  'text-neon-green': 'text-emerald-700 dark:text-neon-green',
  'text-neon-red': 'text-red-700 dark:text-neon-red',

  // Ensure these gradients are readable
  'text-cyan-500': 'text-cyan-700 dark:text-cyan-500',
  'text-cyan-400': 'text-cyan-700 dark:text-cyan-400',
  'text-emerald-500': 'text-emerald-700 dark:text-emerald-500',
  'text-emerald-400': 'text-emerald-700 dark:text-emerald-400',
  'text-emerald-600': 'text-emerald-800 dark:text-emerald-600',
  'text-gray-500': 'text-gray-700 dark:text-wcag-muted' // Replacing our previous text-gray-500 text map to a darker 700 for extra day time readability
};

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'hooks' && file !== 'utils') walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Handle replacements cleanly without destroying dark:
      for (const [key, value] of Object.entries(replacements)) {
        // Regex escaping
        const safeKey = key.replace(/\//g, '\\/');
        // Replace instances of the key that are NOT preceded by `dark:` or `-` 
        // to avoid double patching things like `dark:text-neon-cyan`
        const regex = new RegExp(`(?<!dark:|-)\\b${safeKey}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched Day Mode colors in', fullPath);
      }
    }
  }
}

for (const dir of dirs) {
  walk(dir);
}
console.log('Done patching Day light theme colors.');
