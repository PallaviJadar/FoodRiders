<div align="center">
 
  <h1>🍔 FoodRiders</h1>
  <p><strong>A Next-Generation, Real-Time Food Delivery Platform</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
    <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io" />
  </p>
</div>

<hr />

## 🚀 Overview

**FoodRiders** is an ultra-modern, fully responsive food delivery web application designed to bring the best culinary experiences straight to your door. Built with a robust full-stack architecture, it offers lightning-fast performance, real-time order tracking, and a sleek, futuristic UI.

Whether you're a hungry customer looking for a quick bite or an admin managing a fleet of delivery riders and bustling restaurants, FoodRiders handles it all with seamless efficiency.

## ✨ Key Features

- **🍔 Futuristic User Interface:** A stunning, highly responsive design with fluid animations and a premium glassmorphic feel.
- **📍 Real-Time Tracking:** Live order updates and delivery rider tracking powered by WebSockets (`Socket.io`).
- **🔔 Push Notifications:** Integrated Firebase Cloud Messaging (FCM) for instant alerts on order status, new offers, and admin announcements.
- **🛡️ Comprehensive Admin Dashboard:** Powerful management tools for overseeing restaurants, menus, users, orders, and system settings.
- **🎁 Referral & Reward System:** A robust referral architecture allowing users to earn rewards and discounts.
- **📱 Cross-Platform Ready:** Designed to work flawlessly across desktops, tablets, and mobile devices natively.

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, CSS Modules, Modern CSS Features |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | MongoDB (Mongoose) |
| **Real-Time** | Socket.io |
| **Services** | Firebase Cloud Messaging (Notifications), Multer (Image Compression & Uploads) |

## 📦 Project Structure

```text
foodriders_deploy/
├── src/                  # React Frontend Architecture
│   ├── components/       # Reusable UI Components
│   ├── pages/            # Main application views (Admin, User, etc.)
│   ├── utils/            # Client-side helpers (Sockets, Push Notifications)
│   └── hooks/            # Custom React hooks (useFCM, etc.)
├── server/               # Node.js / Express Backend
│   ├── routes/           # API Endpoints (orders, admin, announcements)
│   ├── models/           # Mongoose Database Schemas
│   └── utils/            # Server utilities (fcm.js, socket.js)
└── public/               # Static assets & manifest files
```



<div align="center">
  <p>Built with ❤️ by <b>Pallavi Jadar</b> (DevXign)</p>
</div>
