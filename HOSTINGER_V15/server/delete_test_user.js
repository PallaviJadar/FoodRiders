const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const deleteTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteOne({ mobile: '9535915055' });
        console.log('Test user deleted.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

deleteTestUser();
