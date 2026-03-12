const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupPath = path.join(BACKUP_DIR, `backup-${date}`);

console.log(`Starting backup to ${backupPath}...`);

// Explicitly point to mongodump if needed, or assume it's in PATH
// Using 'mongodump' requires MongoDB Tools installed on the system
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodriders';
const cmd = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`Backup error: ${error.message}`);
        return;
    }
    console.log(`Backup successful!`);

    // Cleanup logic: Keep last 14 backups
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return;

        // Filter only backup directories
        const backups = files.filter(f => f.startsWith('backup-')).sort(); // lex sort matches date iso format

        if (backups.length > 14) {
            const toDelete = backups.slice(0, backups.length - 14);
            toDelete.forEach(folder => {
                const deletePath = path.join(BACKUP_DIR, folder);
                fs.rm(deletePath, { recursive: true, force: true }, (err) => {
                    if (!err) console.log(`Deleted old backup: ${folder}`);
                });
            });
        }
    });
});
