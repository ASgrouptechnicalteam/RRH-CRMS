const fs = require('fs');
let c = fs.readFileSync('apps/web/tailwind.config.js', 'utf8');
// Replace the colors section - remove old primary/accent etc and add Sonthillu tokens
c = c.replace(
  'primary: { DEFAULT: \"#0f766e\", dark: \"#0d5c56\" },',
  'canvas: \"var(--color-canvas, #F4FAFC)\",\n      navy: { DEFAULT: \"#203873\", deep: \"#172A52\" },'
);
// Remove old color entries
const oldColors = ['accent: #0ea5e9,', 'success: \"#059669\",', 'warning: \"#d97706\",', 'danger: \"#dc2626\",', 'background: #f0fdfa,', 'surface: #ffffff,', 'muted: #475569,', 'text: #0f172a,'];
for (const old of oldColors) {
  c = c.replace(old, '');
}
// Add new colors at the end of the colors object
c = c.replace('}', '      gold: { DEFAULT: \"#E0B040\" },\n      action: \"#4268E8\",\n      primary: \"#203873\",\n    }');
// Update font family
c = c.replace(\"fontFamily: { sans: ['Inter', 'sans-serif'] },\", \"fontFamily: { sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'] }\");
// Remove trailing comma before closing brace if present
c = c.replace('    },\n  plugins: [],\n}', '    },\n  plugins: []\n}');
fs.writeFileSync('apps/web/tailwind.config.js', c);
console.log('Tailwind config updated');