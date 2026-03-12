const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');
        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('Dropping username index...');
        try {
            await collection.dropIndex('username_1');
            console.log('Index dropped.');
        } catch (e) {
            console.log('Index does not exist or already dropped.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixIndex();
