import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src')
];

const replacements = {
  // Text (Careful not to replace normal prefixes accidentally unless strictly exact matches exist, but we do word bound)
  'dark:text-white': 'dark:text-wcag-text',
  'dark:text-gray-100': 'dark:text-wcag-text',
  'dark:text-gray-200': 'dark:text-wcag-text',
  'dark:text-gray-300': 'dark:text-wcag-text',

  'dark:text-gray-400': 'dark:text-wcag-muted',
  'dark:text-gray-500': 'dark:text-wcag-muted',
  'dark:text-gray-600': 'dark:text-wcag-muted',
  'dark:text-gray-700': 'dark:text-wcag-muted',

  // If the previous patch somehow applied strings without dark: prefix, we need to map those too because we never know exactly what state components are in. Actually, the very first patch failed, so components are in ORIGINAL state!
  // Let's replace the native color usages in components explicitly!
  'text-white': 'text-gray-900 dark:text-wcag-text',
  'text-gray-100': 'text-gray-900 dark:text-wcag-text',
  'text-gray-200': 'text-gray-800 dark:text-wcag-text',
  'text-gray-300': 'text-gray-700 dark:text-wcag-text',
  
  'text-gray-400': 'text-gray-500 dark:text-wcag-muted',
  'text-gray-500': 'text-gray-500 dark:text-wcag-muted', // usually muted enough
  'text-gray-600': 'text-gray-500 dark:text-wcag-muted',
  'text-gray-700': 'text-gray-500 dark:text-wcag-muted',

  // Background
  'bg-black/80': 'bg-gray-900/50 dark:bg-wcag-bg',
  'bg-gray-950': 'bg-white dark:bg-wcag-bg',
  'bg-gray-950/80': 'bg-white/80 dark:bg-wcag-bg',
  
  'bg-gray-900/60': 'bg-gray-50 dark:bg-wcag-surface1',
  'bg-gray-900/30': 'bg-gray-50 dark:bg-wcag-surface1',
  'bg-gray-900/40': 'bg-gray-50 dark:bg-wcag-surface1',
  'bg-gray-900/80': 'bg-gray-50 dark:bg-wcag-surface1',
  'bg-gray-900': 'bg-gray-50 dark:bg-wcag-surface1',
  
  'bg-gray-800/30': 'bg-gray-100 dark:bg-wcag-surface2',
  'bg-gray-800/40': 'bg-gray-100 dark:bg-wcag-surface2',
  'bg-gray-800/50': 'bg-gray-100 dark:bg-wcag-surface2',
  'bg-gray-800/60': 'bg-gray-100 dark:bg-wcag-surface2',
  'bg-gray-800': 'bg-gray-100 dark:bg-wcag-surface2',

  // Borders
  'border-white/\\[0\\.04\\]': 'border-gray-200 dark:border-wcag-border',
  'border-white/\\[0\\.06\\]': 'border-gray-200 dark:border-wcag-border',
  'border-white/\\[0\\.08\\]': 'border-gray-300 dark:border-wcag-border',
  'border-white/\\[0\\.1\\]': 'border-gray-300 dark:border-wcag-border',
};

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'hooks' && file !== 'utils') walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      // Don't patch App.jsx because we completely overwrote it perfectly
      if (file === 'App.jsx') continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Handle replacements
      for (const [key, value] of Object.entries(replacements)) {
        // Only run string manipulation safely
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched WCAG colors in', fullPath);
      }
    }
  }
}

for (const dir of dirs) {
  walk(dir);
}
console.log('Done patching WCAG dark theme colors.');
