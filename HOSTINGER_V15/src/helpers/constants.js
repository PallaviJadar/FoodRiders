// Page routes
export const orderOnlinePage = 'order-online';
export const diningOutPage = 'dining-out';
export const proAndProPlusPage = 'pro-and-pro-plus';
export const nightLifePage = 'nightlife-clubs';
export const groceryDeliveryPage = 'grocery-delivery';

// Food category pages
export const pureVegPage = 'pure-veg';
export const mixedMenuPage = 'mixed-menu';
export const nonVegPage = 'non-veg';

// Specialty delivery pages
export const cakesDeliveryPage = 'cakes-delivery';
export const fruitsDeliveryPage = 'fruits-delivery';
export const fishDeliveryPage = 'fish-delivery';
export const meatDeliveryPage = 'meat-delivery';

// Restaurant Menus
export const foodridersCafeMenu = {
    pizzaSizes: {
        small: 4,
        medium: 6,
        large: 8
    },
    classicPizza: {
        "Panjabi Tashan": {
            description: "Cheese, Chilli, Onion, Tandoori Paneer, Coriander",
            prices: {
                small: 129,
                medium: 179,
                large: 239
            }
        },
        "Schezwan Delight": {
            description: "Cheese, Schezwan Sauce, Chilli, Onion, Capsicum, Tomato",
            prices: {
                small: 129,
                medium: 179,
                large: 239
            }
        },
        "Margherita": {
            description: "Delicious Cheese Topping",
            prices: {
                small: 109,
                medium: 159,
                large: 219
            }
        },
        "The Maya": {
            description: "Cheese, Olive, Tomato",
            prices: {
                small: 129,
                medium: 169,
                large: 229
            }
        },
        "Mexican Pizza": {
            description: "Cheese, Chilli, Sweetcorn, Tomato, Olive",
            prices: {
                small: 129,
                medium: 179,
                large: 239
            }
        },
        "American Pizza": {
            description: "Cheese, Onion, Capsicum, Babycorn, Jalapeno",
            prices: {
                small: 119,
                medium: 179,
                large: 239
            }
        },
        "Veg Delight": {
            description: "Cheese, Onion, Mashroom, Capsicum, Tomato, Olive",
            prices: {
                small: 129,
                medium: 179,
                large: 239
            }
        },
        "Paneer Tika Pizza": {
            description: "Cheese, Onion, Capsicum, Tika Paneer",
            prices: {
                small: 129,
                medium: 179,
                large: 239
            }
        }
    },
    snacks: {
        "Fingerchips": 85,
        "Paasta": 79,
        "Red Chilly Paasta": 79,
        "Coffee (Bru)": 39,
        "Water": {
            small: 20,
            large: 30
        }
    }
};

// Restaurant Data
export const restaurants = {
    pureVeg: [
        { name: "Foodriders Cafe", rating: "4.2", cuisine: "South Indian, North Indian", time: "30" },
        { name: "Dwaraka Restaurant", rating: "4.0", cuisine: "South Indian", time: "25" },
        { name: "Malasa Mangally Hotel", rating: "4.1", cuisine: "South Indian", time: "35" },
        { name: "Aras Grand", rating: "4.3", cuisine: "South Indian, North Indian", time: "40" },
        { name: "Gokul Hotel", rating: "4.0", cuisine: "South Indian", time: "20" },
        { name: "Shankar Idli Center", rating: "4.4", cuisine: "South Indian", time: "25" },
        { name: "Davanagere Bennedose Center", rating: "4.2", cuisine: "South Indian", time: "30" },
        { name: "Prabhu Malabadi Khanavali", rating: "4.1", cuisine: "North Karnataka", time: "35" },
        { name: "Basaveshwar Lingayat Khanavali", rating: "4.3", cuisine: "North Karnataka", time: "30" },
        { name: "Hundekar Khanavali", rating: "4.0", cuisine: "North Karnataka", time: "25" }
    ],
    mixedMenu: [
        { name: "Manish Restaurant", rating: "4.2", cuisine: "North Indian, Chinese", time: "35" },
        { name: "U K Dhaba", rating: "4.1", cuisine: "North Indian, Punjabi", time: "40" },
        { name: "Hotel Nandini Deluxe", rating: "4.5", cuisine: "South & North Indian, Chinese", time: "30", address: "Banahatti Road, Mahalingpur-587312" }
    ],
    cakes: [
        { name: "Cakewala Bakery", rating: "4.6", cuisine: "Cakes, Desserts, Bakery", time: "20" }
    ]
};

export const reviewPage = 'reviews'
export const photosPage = 'photos'
export const followersPage = 'followers'
export const recentlyviewedPage = 'recently-viewed'
export const bookmarksPage = 'bookmarks'
export const blogpostsPage = 'blog-posts'
export const orderhistoryPage = 'order-history'
export const myaddressPage = 'my-address'
export const favoriteordersPage = 'favorite-orders'
export const bookingsPage = 'bookings'

export const deliveryCharges = {
    base: 30, // Base delivery charge
    freeDeliveryThreshold: 300 // Free delivery for orders above this amount
};