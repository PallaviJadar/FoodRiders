const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'utils', 'RestaurantUtils');
const folders = ['BackButton', 'DownloadAppUtil', 'DropdownUtil', 'FoodItemProduct', 'LabelUtil', 'OfferTrackUtil', 'RatingNumberBox', 'RatingUtil', 'RestUserReviewedCard', 'SmallSearchBarUtil'];

folders.forEach(folder => {
    const folderPath = path.join(dir, folder);
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
            const src = path.join(folderPath, file);
            const dest = path.join(dir, file);
            console.log(`Moving ${src} to ${dest}`);
            fs.renameSync(src, dest);
        });
        console.log(`Deleting ${folderPath}`);
        fs.rmdirSync(folderPath, { recursive: true });
    }
});
