import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const { item, restaurantName, restaurantId } = action.payload;
            // Enforce single-restaurant rule
            if (state.restaurantName && state.restaurantName !== restaurantName) {
                return state; // Caller should warn user
            }
            const existing = state.items.findIndex(i => i.name === item.name);
            let newItems;
            if (existing > -1) {
                newItems = state.items.map((i, idx) =>
                    idx === existing ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                newItems = [...state.items, { ...item, quantity: 1, restaurant: restaurantName }];
            }
            return { ...state, items: newItems, restaurantName, restaurantId };
        }
        case 'REMOVE_ITEM': {
            const existing = state.items.findIndex(i => i.name === action.payload.name);
            if (existing === -1) return state;
            const item = state.items[existing];
            let newItems;
            if (item.quantity > 1) {
                newItems = state.items.map((i, idx) =>
                    idx === existing ? { ...i, quantity: i.quantity - 1 } : i
                );
            } else {
                newItems = state.items.filter((_, idx) => idx !== existing);
            }
            if (newItems.length === 0) {
                return { items: [], restaurantName: null, restaurantId: null };
            }
            return { ...state, items: newItems };
        }
        case 'CLEAR_CART':
            return { items: [], restaurantName: null, restaurantId: null };
        default:
            return state;
    }
};

const initialState = { items: [], restaurantName: null, restaurantId: null };

export function CartProvider({ children }) {
    const [cart, dispatch] = useReducer(cartReducer, initialState);

    const addItem = (item, restaurantName, restaurantId) => {
        dispatch({ type: 'ADD_ITEM', payload: { item, restaurantName, restaurantId } });
    };
    const removeItem = (item) => {
        dispatch({ type: 'REMOVE_ITEM', payload: item });
    };
    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addItem, removeItem, clearCart, totalItems, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
