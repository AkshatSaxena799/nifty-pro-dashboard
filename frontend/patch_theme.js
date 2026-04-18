const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const replacements = {
  // Text colors
  'text-gray-400': 'text-gray-500 dark:text-gray-400',
  'text-gray-300': 'text-gray-700 dark:text-gray-300',
  'text-gray-200': 'text-gray-800 dark:text-gray-200',
  'text-gray-500': 'text-gray-400 dark:text-gray-500',
  'text-gray-600': 'text-gray-500 dark:text-gray-600',
  'text-gray-700': 'text-gray-600 dark:text-gray-700',
  'text-gray-800': 'text-gray-700 dark:text-gray-800',
  'text-white': 'text-gray-900 dark:text-white',

  // Background colors
  'bg-gray-900/30': 'bg-gray-100/50 dark:bg-gray-900/30',
  'bg-gray-900/40': 'bg-gray-100/60 dark:bg-gray-900/40',
  'bg-gray-900/60': 'bg-gray-100/70 dark:bg-gray-900/60',
  'bg-gray-900/80': 'bg-gray-100/80 dark:bg-gray-900/80',
  'bg-gray-900': 'bg-white dark:bg-gray-900',
  'bg-gray-800/30': 'bg-gray-50 dark:bg-gray-800/30',
  'bg-gray-800/40': 'bg-gray-100 dark:bg-gray-800/40',
  'bg-gray-800/50': 'bg-gray-100 dark:bg-gray-800/50',
  'bg-gray-800': 'bg-gray-100 dark:bg-gray-800',

  // Borders
  'border-white/\\[0\\.04\\]': 'border-gray-200 dark:border-white/[0.04]',
  'border-white/\\[0\\.06\\]': 'border-gray-200 dark:border-white/[0.06]',
  'border-white/\\[0\\.08\\]': 'border-gray-300 dark:border-white/[0.08]',
  'border-white/\\[0\\.1\\]': 'border-gray-300 dark:border-white/[0.1]',

  // Neon colors
  'text-neon-cyan': 'text-cyan-600 dark:text-neon-cyan',
  'text-neon-green': 'text-emerald-500 dark:text-neon-green',
  'text-neon-red': 'text-rose-500 dark:text-neon-red',
};

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Ensure we don't double replace
      for (const [key, value] of Object.entries(replacements)) {
        // Create regex to match the class name when it's NOT adjacent to 'dark:'
        // This regex trick ensures we don't accidentally replace already patched strings
        const regex = new RegExp(`(?<!dark:)${key}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched', fullPath);
      }
    }
  }
}

walk(dir);
console.log('Done patching theme classes.');
