import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src')
];

// Target specifically the light mode classes currently making text unreadable 
// and map them to ultra-dark (800/900/950) shades.
const replacements = {
  // Grays / Secondary Text
  'text-gray-500': 'text-gray-800',
  'text-gray-400': 'text-gray-700',
  'text-gray-300': 'text-gray-700',
  
  // Greens -> ultra-dark green for contrast
  'text-emerald-500': 'text-green-900',
  'text-emerald-400': 'text-green-900',
  'text-emerald-600': 'text-green-950',
  'text-emerald-700': 'text-green-950',
  
  // Cyans -> ultra-dark blue
  'text-cyan-500': 'text-blue-900',
  'text-cyan-400': 'text-blue-900',
  'text-cyan-600': 'text-blue-950',
  'text-cyan-700': 'text-blue-950',
  'text-cyan-800': 'text-blue-950',
  
  // Ambers -> dark brown/orange
  'text-amber-500': 'text-amber-900',
  'text-amber-400': 'text-amber-900',
  'text-yellow-500': 'text-yellow-900',
  
  // Reds -> darkest red
  'text-red-500': 'text-red-900',
  'text-red-400': 'text-red-900',
  'text-red-600': 'text-red-950',
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

      // Ensure we DO NOT target anything with 'dark:' prefix 
      // or 'bg-' or 'border-', ONLY 'text-'
      for (const [key, value] of Object.entries(replacements)) {
        // Negative lookbehind for dark: and strictly match word
        const safeKey = key.replace(/\-/g, '\\-');
        const regex = new RegExp(`(?<!dark:)\\b${safeKey}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched ultra-dark Day Mode texts in', fullPath);
      }
    }
  }
}

for (const dir of dirs) {
  walk(dir);
}
console.log('Done ultra-darkening light theme texts.');
