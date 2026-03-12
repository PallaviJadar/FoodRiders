# Deploying FoodRiders on Hostinger (VPS or Node.js Hosting)

This zip file contains the **Backend Server** pre-packaged with the **Frontend Build** (in `public/`) and a **Database Export** (in `db_export/`).

## 1. Upload & Setup
1.  Upload the `FoodRiders_Deploy.zip` to your Hostinger File Manager/VPS.
2.  Extract it to your desired folder (e.g., `public_html/app` or `/var/www/app`).
3.  Ensure your domain points to this server.

## 2. Database Connection (MongoDB Atlas)
Since you cannot host MongoDB directly on standard Shared Hosting:
1.  Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a Cluster -> Database -> User.
3.  Get your **Connection String** (URI). It looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`.
4.  Edit the `.env` file in this folder and update `MONGO_URI` with your Atlas URI.

## 3. Import Data
To restore your local data to the cloud:
1.  Install **MongoDB Compass** on your local computer.
2.  Connect to your **Atlas URI**.
3.  Create a database named `test` (or whatever is in your URI).
4.  For each file in the `db_export` folder (`users.json`, `restaurants.json`, etc.):
    *   Create a Collection with that name (e.g., `users`).
    *   Click "Add Data" -> "Import JSON or CSV" -> Select the corresponding JSON file.

## 4. Install Dependencies & Start
If using **VPS/Terminal**:
1.  `cd` into the folder.
2.  Run `npm install --production`.
3.  Run `pm2 start server.js --name "foodriders"` (Recommended) or `node server.js`.

If using **Hostinger Node.js Manager**:
1.  Select the application root.
2.  Install dependencies (Button).
3.  Start the app.
