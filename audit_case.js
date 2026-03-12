const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file === 'node_modules' || file === '.git') return;
            results = results.concat(walk(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

const allFiles = walk(path.join(__dirname, 'src'));
const extensions = ['', '.jsx', '.js', '.css', '.module.css', '.png', '.jpg', '.svg', '.jpeg', '.webp'];

let errors = [];

allFiles.forEach(file => {
    if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
        const content = fs.readFileSync(file, 'utf8');
        const fileDir = path.dirname(file);

        // Match imports and require statements
        const regex = /import\s+.*\s+from\s+(['"])(\.?\.?\/[^'"]+)\1|import\s+(['"])(\.?\.?\/[^'"]+)\3|require\((['"])(\.?\.?\/[^'"]+)\5\)/g;

        let match;
        while ((match = regex.exec(content)) !== null) {
            const relPath = match[2] || match[4] || match[6];
            if (!relPath || !relPath.startsWith('.')) continue;

            let foundExact = false;
            let foundCaseInsensitive = false;
            let actualName = '';

            for (let ext of extensions) {
                const targetPath = path.resolve(fileDir, relPath + ext);
                const targetDir = path.dirname(targetPath);
                const targetBase = path.basename(targetPath);

                if (fs.existsSync(targetDir)) {
                    const filesInDir = fs.readdirSync(targetDir);
                    if (filesInDir.includes(targetBase)) {
                        foundExact = true;
                        break;
                    } else if (filesInDir.find(f => f.toLowerCase() === targetBase.toLowerCase())) {
                        foundCaseInsensitive = true;
                        actualName = filesInDir.find(f => f.toLowerCase() === targetBase.toLowerCase());
                        break;
                    }
                }

                // Check index files
                const indexPath = path.resolve(fileDir, relPath, 'index' + ext);
                const indexDir = path.dirname(indexPath);
                const indexBase = path.basename(indexPath);
                if (fs.existsSync(indexDir)) {
                    const filesInDir = fs.readdirSync(indexDir);
                    if (filesInDir.includes(indexBase)) {
                        foundExact = true;
                        break;
                    } else if (filesInDir.find(f => f.toLowerCase() === indexBase.toLowerCase())) {
                        foundCaseInsensitive = true;
                        actualName = filesInDir.find(f => f.toLowerCase() === indexBase.toLowerCase());
                        break;
                    }
                }
            }

            if (foundCaseInsensitive && !foundExact) {
                errors.push({
                    file: path.relative(__dirname, file),
                    import: relPath,
                    expected: actualName,
                    fullPath: path.resolve(fileDir, relPath)
                });
            } else if (!foundExact && !foundCaseInsensitive) {
                // Not found at all - maybe it's an alias or deliberate?
                // For now, only focus on case sensitivity
            }
        }
    }
});

if (errors.length > 0) {
    console.log('--- CASE SENSITIVITY ERRORS FOUND ---');
    errors.forEach(err => {
        console.log(`[${err.file}] Import "${err.import}" should be "${err.expected.replace('.jsx', '').replace('.js', '')}"`);
    });
} else {
    console.log('No case sensitivity mismatches found.');
}
