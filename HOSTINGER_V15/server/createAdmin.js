const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/foodriders'); // Change if your DB URI is different

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123'; // Change to a strong password!
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    password: hashedPassword,
    role: 'admin'
  });

  await user.save();
  console.log('Admin user created!');
  mongoose.disconnect();
}

createAdmin();
