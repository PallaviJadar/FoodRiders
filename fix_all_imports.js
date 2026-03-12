const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

const foldersToFlat = [
    'BackButton', 'DownloadAppUtil', 'DropdownUtil', 'FoodItemProduct', 'LabelUtil',
    'OfferTrackUtil', 'RatingNumberBox', 'RatingUtil', 'RestUserReviewedCard',
    'SmallSearchBarUtil', 'MenuCard', 'CategoryHeader', 'MenuCardPlaceholder',
    'ConfirmModal', 'MenuImage', 'FloatingThemeToggle', 'PersistentOrderTracker',
    'GlobalUserNotifications', 'GlobalAdminNotifications', 'GlobalDeliveryNotifications',
    'ComingSoon', 'OverviewAboutCard', 'RecentlyViewedCard', 'CollectionsCard'
];

const allFiles = walk(path.join(__dirname, 'src'));

allFiles.forEach(file => {
    if (file.endsWith('.jsx') || file.endsWith('.js')) {
        let content = fs.readFileSync(file, 'utf8');
        let changed = false;

        foldersToFlat.forEach(folder => {
            // Find paths like /Folder/Folder and replace with /Folder.jsx
            const searchStr = `/${folder}/${folder}`;
            const replaceStr = `/${folder}.jsx`;
            if (content.includes(searchStr)) {
                console.log(`Replacing ${searchStr} in ${file}`);
                content = content.split(searchStr).join(replaceStr);
                changed = true;
            }
        });

        // Special cases for files that might have been partially updated or already had extensions
        if (content.includes('/MenuCard.jsx/MenuCard.jsx')) {
            console.log(`Fixing double extension in ${file}`);
            content = content.split('/MenuCard.jsx/MenuCard.jsx').join('/MenuCard.jsx');
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(file, content);
        }
    }
});
