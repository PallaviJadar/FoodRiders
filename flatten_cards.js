const fs = require('fs');
const path = require('path');

const foldersToFlat = [
    { parent: 'src/utils/Cards/RestaurantBodyCards', folder: 'MenuCard' },
    { parent: 'src/utils/Cards/RestaurantBodyCards', folder: 'OverviewAboutCard' },
    { parent: 'src/utils/Cards/RecentlyViewedCard', folder: 'RecentlyViewedCard' },
    { parent: 'src/utils/Cards/card2', folder: 'CollectionsCard' }
];

foldersToFlat.forEach(item => {
    const parentDir = path.join(__dirname, item.parent);
    const folderPath = path.join(parentDir, item.folder);
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
            const src = path.join(folderPath, file);
            const dest = path.join(parentDir, file);
            console.log(`Moving ${src} to ${dest}`);
            fs.renameSync(src, dest);
        });
        console.log(`Deleting ${folderPath}`);
        fs.rmdirSync(folderPath, { recursive: true });
    }
});
