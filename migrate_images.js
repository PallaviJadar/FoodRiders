const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateAllBase64Images() {
    try {
        console.log('--- Database Migration: Base64 to Local Files ---');
        await mongoose.connect(process.env.MONGO_URI);
        const Restaurant = require('./server/models/Restaurant');

        const restaurants = await Restaurant.find();
        let totalConverted = 0;
        let totalSkipped = 0;

        const uploadsDir = path.join(__dirname, 'server', 'uploads');
        const rootUploadsDir = path.join(__dirname, 'uploads');

        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        if (!fs.existsSync(rootUploadsDir)) fs.mkdirSync(rootUploadsDir, { recursive: true });

        for (const resDoc of restaurants) {
            let modified = false;

            // 1. Check Restaurant main image
            if (resDoc.image && resDoc.image.startsWith('data:')) {
                try {
                    const filename = `rest_${resDoc._id}_${Date.now()}.webp`;
                    const base64Data = resDoc.image.split(';base64,').pop();
                    const buffer = Buffer.from(base64Data, 'base64');

                    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
                    fs.writeFileSync(path.join(rootUploadsDir, filename), buffer);

                    console.log(`[Restaurant] ${resDoc.name}: Main image converted.`);
                    resDoc.image = filename;
                    modified = true;
                    totalConverted++;
                } catch (e) {
                    console.error(`Error converting main image for ${resDoc.name}:`, e.message);
                }
            }

            // 2. Check Menu Items
            if (resDoc.categories) {
                for (let c = 0; c < resDoc.categories.length; c++) {
                    const cat = resDoc.categories[c];
                    if (cat.items) {
                        for (let i = 0; i < cat.items.length; i++) {
                            const item = cat.items[i];
                            if (item.image && item.image.startsWith('data:')) {
                                try {
                                    const ext = item.image.includes('png') ? 'png' : 'webp';
                                    const filename = `item_${resDoc._id}_${c}_${i}_${Date.now()}.${ext}`;
                                    const base64Data = item.image.split(';base64,').pop();
                                    const buffer = Buffer.from(base64Data, 'base64');

                                    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
                                    fs.writeFileSync(path.join(rootUploadsDir, filename), buffer);

                                    item.image = filename;
                                    modified = true;
                                    totalConverted++;
                                } catch (e) {
                                    console.error(`Error converting item image in ${resDoc.name}:`, e.message);
                                }
                            } else if (item.image) {
                                totalSkipped++;
                            }
                        }
                    }
                }
            }

            if (modified) {
                // Use markModified for nested arrays
                resDoc.markModified('categories');
                await resDoc.save();
                console.log(`✅ [DB UPDATE] ${resDoc.name} saved with optimized images.`);
            }
        }

        console.log(`--- Migration Complete ---`);
        console.log(`Total Images Converted to Files: ${totalConverted}`);
        console.log(`Total Images Already Optimized: ${totalSkipped}`);

    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        process.exit(0);
    }
}

migrateAllBase64Images();
