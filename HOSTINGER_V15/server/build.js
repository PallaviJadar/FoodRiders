const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'public');
const dest = path.join(__dirname, 'dist');

console.log(`Starting Build (Copying ${src} to ${dest})...`);

if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
}

function copyRecursive(source, target) {
    if (!fs.existsSync(source)) return;

    const stats = fs.statSync(source);
    if (stats.isDirectory()) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }
        fs.readdirSync(source).forEach(child => {
            copyRecursive(path.join(source, child), path.join(target, child));
        });
    } else {
        fs.copyFileSync(source, target);
    }
}

try {
    copyRecursive(src, dest);
    console.log('✅ Build Complete: dist folder created from public.');
} catch (err) {
    console.error('❌ Build Failed:', err);
    process.exit(1);
}
