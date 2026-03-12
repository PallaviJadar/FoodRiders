import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import css from './MenuCard.module.css';
import MenuImage from './MenuImage.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const MenuCard = ({ item, restaurant, restaurantName, categoryName, isOpen, isAdmin, onEdit, onDelete, onImageClick, isAnyItemEditing, setIsAnyItemEditing }) => {
    const { addToCart, setIsCartOpen, activeRestaurantName, clearCart, showCollisionModal } = useCart();

    const [isEditing, setIsEditing] = useState(false);
    const [editConfirmOpen, setEditConfirmOpen] = useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

    // Local state for editing fields
    const [editData, setEditData] = useState({
        name: item?.name || '',
        price: item?.price || 0
    });

    if (!item) return null;

    // availability object comes from DynamicRestaurantMenu
    const categoryAvailability = item.categoryAvailability || { isAvailable: true, badgeText: '🟢 Open now' };

    // An item is available only if restaurant IS OPEN AND its category is open AND the item itself is marked available
    const isItemSelfAvailable = item.isAvailable !== false;
    const isAvailable = isOpen && categoryAvailability.isAvailable && isItemSelfAvailable;

    // Determine the message to show to users
    let availabilityMsg = null;
    if (!isOpen) {
        availabilityMsg = '🔴 Restaurant Closed';
    } else if (!categoryAvailability.isAvailable) {
        availabilityMsg = categoryAvailability.badgeText; // e.g. "🔴 Opens at 4:30 PM" or "🔴 Temporarily closed"
    } else if (!isItemSelfAvailable) {
        availabilityMsg = '🔴 Currently unavailable';
    }

    const isCake = (categoryName && categoryName.toLowerCase().includes('cake')) ||
        (item.category && item.category.toLowerCase().includes('cake'));

    const initialSizes = isCake ? [
        { size: 'Half KG', price: 400 },
        { size: '1 KG', price: 700 }
    ] : (item.sizes || []);

    const [selectedSize, setSelectedSize] = useState(
        initialSizes.length > 0 ? initialSizes[0].size : null
    );

    const hasSizes = initialSizes.length > 0;

    const getPrice = () => {
        let base = 0;
        if (isCake) {
            base = selectedSize === 'Half KG' ? 400 : 700;
        } else if (!item.sizes || item.sizes.length === 0) {
            base = item.price;
        } else {
            const sizeObj = item.sizes.find(s => s.size === selectedSize);
            base = sizeObj ? sizeObj.price : item.sizes[0].price;
        }

        // Apply Price Adjustment only if it's NOT admin and adjustment is enabled
        const adjustment = restaurant?.priceAdjustment;
        if (!isAdmin && adjustment?.enabled) {
            let adjusted = base;
            if (adjustment.type === 'percentage') {
                adjusted = base + (base * adjustment.value / 100);
            } else {
                adjusted = base + adjustment.value;
            }
            return Math.round(adjusted);
        }

        return base;
    };

    const getBasePrice = () => {
        if (isCake) return selectedSize === 'Half KG' ? 400 : 700;
        if (!item.sizes || item.sizes.length === 0) return item.price;
        const sizeObj = item.sizes.find(s => s.size === selectedSize);
        return sizeObj ? sizeObj.price : item.sizes[0].price;
    };

    const handleAddToCart = () => {
        if (!isAvailable || isAdmin) return;

        const price = getPrice();
        const basePrice = getBasePrice();
        const finalName = isCake ? `${item.name} (${selectedSize})` :
            (item.sizes && item.sizes.length > 0 ? `${item.name} (${selectedSize})` : item.name);

        const cartItem = {
            id: (item.sizes || isCake) ? `${item.name}-${selectedSize}-${restaurantName}` : `${item.name}-${restaurantName}`,
            name: finalName,
            price, // Final adjusted price
            basePrice, // Original price
            adjustmentApplied: restaurant?.priceAdjustment?.enabled ? {
                amount: restaurant.priceAdjustment.value,
                type: restaurant.priceAdjustment.type
            } : null,
            image: item.image,
            category: categoryName || item.category,
            restaurant: restaurantName,
            size: selectedSize
        };

        // Check for single restaurant restriction
        if (activeRestaurantName && activeRestaurantName !== restaurantName) {
            showCollisionModal(cartItem);
            return;
        }

        addToCart(cartItem);
        setIsCartOpen(true);
    };

    const startEditing = () => {
        if (isAnyItemEditing) {
            alert('Please finish editing the current item first.');
            return;
        }
        setEditConfirmOpen(true);
    };

    const confirmStartEditing = () => {
        setEditData({ name: item.name, price: item.price });
        setIsEditing(true);
        setIsAnyItemEditing(true);
        setEditConfirmOpen(false);
    };

    const handleSaveRequest = () => {
        setSaveConfirmOpen(true);
    };

    const confirmSave = () => {
        if (!isAdmin || !onEdit) return;
        const updatedItem = { ...item, ...editData };
        delete updatedItem.categoryAvailability;
        onEdit(updatedItem);
        setIsEditing(false);
        setIsAnyItemEditing(false);
        setSaveConfirmOpen(false);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setIsAnyItemEditing(false);
    };

    const toggleItemSelfAvailability = () => {
        if (!isAdmin || !onEdit) return;
        const updatedItem = { ...item, isAvailable: !isItemSelfAvailable };
        delete updatedItem.categoryAvailability;
        onEdit(updatedItem);
    }

    // Highlight logic
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const highlight = params.get('highlight'); // e.g. "Chicken Biryani"

        if (highlight && item.name.toLowerCase().includes(highlight.toLowerCase())) {
            setIsHighlighted(true);
            setTimeout(() => {
                const element = document.getElementById(`menu-item-${item.name.replace(/\s+/g, '-')}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Remove highlight effect after 2s
                    setTimeout(() => setIsHighlighted(false), 2000);
                }
            }, 500); // Small delay to ensure render
        }
    }, [item.name]);

    return (
        <>
            <motion.div
                id={`menu-item-${item.name.replace(/\s+/g, '-')}`}
                className={`${css.menuItem} ${isAdmin ? css.adminItem : ''} ${!isAvailable && !isAdmin ? css.unavailableItem : ''} ${isEditing ? css.editingMode : ''} ${isHighlighted ? css.highlightItem : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={isHighlighted ? { border: '2px solid #ff6b6b', transform: 'scale(1.02)' } : {}}
            >
                {isEditing && <div className={css.editingBadge}>Editing Mode</div>}

                {!isAvailable && !isAdmin && (
                    <div className={css.unavailableOverlay}>
                        <span className={css.unavailableText}>Not Available Now</span>
                    </div>
                )}
                {isAdmin && (
                    <div className={css.deleteOverlay} onClick={() => onDelete(item)}>
                        🗑️
                    </div>
                )}
                <div className={css.menuItemContent}>
                    <div
                        className={`${css.itemImage} ${isAdmin ? css.clickableImage : ''} ${!isAvailable && !isAdmin ? css.unavailableImage : ''}`}
                        onClick={() => isAdmin && onImageClick && onImageClick(item)}
                    >
                        <MenuImage
                            itemName={item.name}
                            categoryName={categoryName}
                            restaurantName={restaurantName}
                            src={item.image}
                        />
                        {isAdmin && (
                            <div className={css.imageOverlay}>
                                <span className={css.cameraIcon}>📷</span>
                            </div>
                        )}
                    </div>
                    <div className={css.itemDetails}>
                        <div className={`${css.itemName} ${isAdmin ? css.editableArea : ''}`}>
                            {isAdmin && isEditing ? (
                                <span
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => setEditData(prev => ({ ...prev, name: e.target.innerText }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.target.blur();
                                        }
                                    }}
                                    className={css.editingText}
                                >
                                    {editData.name}
                                </span>
                            ) : item.name}
                            {isCake && <span className={css.cakeTag}>Cold Cake Only</span>}
                            {isAdmin && !isEditing && (
                                <span className={css.editIcon} onClick={startEditing}>✏️</span>
                            )}
                        </div>

                        {!isAvailable && !isAdmin && (
                            <div className={css.unavailableLabel}>
                                {availabilityMsg}
                            </div>
                        )}

                        {isAdmin && (
                            <div className={css.adminAvailability} onClick={toggleItemSelfAvailability}>
                                <span className={`${css.statusDot} ${isItemSelfAvailable ? css.online : css.offline}`}></span>
                                {isItemSelfAvailable ? 'Display: Available' : 'Display: Unavailable'}
                                {(!categoryAvailability.isAvailable) && <small className={css.catWarning}>(Cat Closed)</small>}
                            </div>
                        )}

                        {(hasSizes || isCake) ? (
                            <div className={css.sizeSelector}>
                                {(isCake ? initialSizes : item.sizes).map(size => {
                                    // Calculate adjusted price for the size selector
                                    let displayPrice = size.price;
                                    const adjustment = restaurant?.priceAdjustment;
                                    if (!isAdmin && adjustment?.enabled) {
                                        if (adjustment.type === 'percentage') {
                                            displayPrice = Math.round(size.price + (size.price * adjustment.value / 100));
                                        } else {
                                            displayPrice = Math.round(size.price + adjustment.value);
                                        }
                                    }

                                    return (
                                        <button
                                            key={size.size}
                                            className={`${css.sizeButton} ${selectedSize === size.size ? css.selectedSize : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSize(size.size);
                                            }}
                                            disabled={!isAvailable && !isAdmin}
                                        >
                                            {size.size} - ₹{displayPrice}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={`${css.itemPrice} ${isAdmin ? css.editableArea : ''}`}>
                                {isAdmin && isEditing ? (
                                    <>
                                        <span>₹</span>
                                        <span
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const val = Number(e.target.innerText.replace(/[^0-9]/g, ''));
                                                setEditData(prev => ({ ...prev, price: val }));
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.target.blur();
                                                }
                                            }}
                                            className={css.editingText}
                                        >
                                            {editData.price}
                                        </span>
                                    </>
                                ) : (
                                    `₹${getPrice()}`
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {isAdmin && isEditing && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button className={css.saveChangesBtn} onClick={handleSaveRequest}>
                            Save Changes
                        </button>
                        <button className={css.cancelEditBtn} onClick={cancelEditing}>
                            Cancel
                        </button>
                    </div>
                )}

                {!isAdmin && (
                    <button
                        className={`${css.addToCartBtn} ${!isAvailable ? css.disabledBtn : ''}`}
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                    >
                        {isAvailable ? 'Add' : 'Unavailable'}
                    </button>
                )}
            </motion.div>

            <ConfirmModal
                isOpen={editConfirmOpen}
                onCancel={() => setEditConfirmOpen(false)}
                onConfirm={confirmStartEditing}
                title="Edit Menu Item?"
                message={`Are you sure you want to edit "${item.name}"? This will enable editing mode for this card.`}
                cancelText="No, Cancel"
                confirmText="Yes, Edit"
            />

            <ConfirmModal
                isOpen={saveConfirmOpen}
                onCancel={() => setSaveConfirmOpen(false)}
                onConfirm={confirmSave}
                title="Save Changes?"
                message="Are you sure you want to save the changes to this menu item?"
                cancelText="Discard"
                confirmText="Save"
            />
        </>
    );
};

export default MenuCard;
