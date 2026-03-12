const fs = require('fs');

const content = fs.readFileSync('../src/components/RestaurantComponents/NandiniMenu/NandiniMenu.jsx', 'utf8');

// Find start of menuData
const startMarker = 'const menuData = {';
const startIndex = content.indexOf(startMarker);

// Find end marker (approximate, since it's before useState)
// better: count braces.
// Or just find "const [searchTerm" and backup to last "};"

const endMarker = 'const [searchTerm';
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

// Extract roughly
let jsonText = content.substring(startIndex + 'const menuData = '.length, endIndex);
// Trim from right until we hit ';'
jsonText = jsonText.trim();
while (jsonText.endsWith(';') || jsonText.endsWith('\n')) {
    jsonText = jsonText.slice(0, -1).trim();
}

// Now we have a JS Object string (keys might not be quoted, but in Nandini they seemed to be distinct).
// Let's eval it (safe enough in this env).
// Wrap in parentheses to ensure expression evaluation
const data = eval('(' + jsonText + ')');

// Write directly to file to avoid PowerShell encoding mess
fs.writeFileSync('nandini_final.json', JSON.stringify(data, null, 2), 'utf8');
console.log("Saved to nandini_final.json");
