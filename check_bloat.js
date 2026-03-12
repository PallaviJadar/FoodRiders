const mongoose = require('mongoose');
require('dotenv').config();

async function checkSpecificRestaurant() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        // Use the ID from the user's screenshot
        const targetId = '6954f8dc6e09d3cef1b61c66';

        const doc = await db.collection('restaurants').findOne({ _id: new mongoose.Types.ObjectId(targetId) });

        if (!doc) {
            console.log('Restaurant not found');
            return;
        }

        const size = JSON.stringify(doc).length;
        console.log(`Restaurant Name: ${doc.name}`);
        console.log(`BSON Size: ${(size / 1024).toFixed(2)} KB`);

        let base64Count = 0;
        let base64TotalSize = 0;

        if (doc.categories) {
            doc.categories.forEach(cat => {
                if (cat.items) {
                    cat.items.forEach(item => {
                        if (item.image && item.image.startsWith('data:')) {
                            base64Count++;
                            base64TotalSize += item.image.length;
                        }
                    });
                }
            });
        }

        console.log(`Base64 Images Found: ${base64Count}`);
        console.log(`Approx Base64 Data Size: ${(base64TotalSize / 1024).toFixed(2)} KB`);

        // Check if there are other large fields
        console.log('Fields count:', Object.keys(doc).length);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

checkSpecificRestaurant();
