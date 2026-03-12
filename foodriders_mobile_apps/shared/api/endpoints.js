export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    PROFILE: '/user/profile',
    UPDATE_TOKEN: '/user/update-token', // FCM token

    // Restaurants & Menu
    RESTAURANTS: '/restaurant',
    RESTAURANT_DETAILS: (id) => `/restaurant/${id}`,
    MENU: '/menu',
    GET_RESTAURANT_MENU: (id) => `/menu/restaurant/${id}`,

    // Orders
    CREATE_ORDER: '/orders/create',
    ORDERS: '/orders',
    USER_ORDERS: '/user/orders',
    ORDER_DETAILS: (id) => `/orders/${id}`,
    UPDATE_ORDER_STATUS: '/orders/update-status',

    // Admin
    GET_LIVE_ORDERS: '/orders/all?liveOnly=true',
    ALL_ORDERS: '/orders/all',
    MARK_SEEN: (id) => `/orders/${id}/seen`,

    // Rider
    GET_RIDER_DELIVERIES: '/delivery/my-deliveries',
    ACCEPT_DELIVERY: '/delivery/accept',
    UPDATE_DELIVERY_STATUS: '/delivery/update-status',
};
