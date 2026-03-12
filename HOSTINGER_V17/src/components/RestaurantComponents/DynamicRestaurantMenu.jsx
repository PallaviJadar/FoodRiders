import React from 'react';
import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';
import MenuCard from '../../utils/RestaurantUtils/MenuCard.jsx';
import MenuCardPlaceholder from '../../utils/RestaurantUtils/MenuCardPlaceholder.jsx';
import { checkAvailability } from '../../utils/RestaurantUtils/timeUtils';
import css from './DynamicRestaurantMenu.module.css';

const DynamicRestaurantMenu = ({
    restaurant,
    isAdmin,
    onUpdateItem,
    onDeleteItem,
    onAddItem,
    onUpdateCategory,
    onDeleteCategory,
    onUpdateCategoryDetails,
    onImageUpload,
    searchTerm = "",
    isOpen = true
}) => {
    const [activeCategory, setActiveCategory] = React.useState('All');
    const [isAnyItemEditing, setIsAnyItemEditing] = React.useState(false);
    if (!restaurant) return null;

    // Decorate categories and items with their original indices to ensure updates targeting correct items even when filtered
    let displayCategories = (restaurant.categories || []).map((cat, catIdx) => ({
        ...cat,
        _originalIndex: catIdx,
        items: (cat.items || []).map((item, itemIdx) => ({
            ...item,
            _originalIndex: itemIdx
        }))
    }));

    // Filter by Search Term
    if (searchTerm.trim() !== "") {
        const lowerSearch = searchTerm.toLowerCase();
        displayCategories = displayCategories.map(cat => {
            const categoryMatches = cat.name.toLowerCase().includes(lowerSearch);
            const filteredItems = cat.items.filter(item =>
                item.name.toLowerCase().includes(lowerSearch) ||
                (item.description && item.description.toLowerCase().includes(lowerSearch))
            );

            if (categoryMatches) return cat;
            if (filteredItems.length > 0) return { ...cat, items: filteredItems };
            return null;
        }).filter(Boolean);
    }

    // Filter by Active Category
    if (activeCategory !== 'All' && !isAdmin) {
        displayCategories = displayCategories.filter(cat => cat.name === activeCategory);
    }

    const categoryList = ['All', ...(restaurant.categories || []).map(cat => cat.name)];

    if (!isAdmin && displayCategories.length === 0) {
        if (searchTerm.trim() !== "") {
            return (
                <div className={css.emptyMenu}>
                    <div className={css.emptyIcon}>🔍</div>
                    <h2 className={css.emptyTitle}>No items found</h2>
                    <p className={css.emptyText}>
                        We couldn't find any items matching "<strong>{searchTerm}</strong>". Try a different search!
                    </p>
                </div>
            );
        }
        return (
            <div className={css.emptyMenu}>
                <div className={css.emptyIcon}>🍽️</div>
                <h2 className={css.emptyTitle}>Menu Coming Soon</h2>
                <p className={css.emptyText}>
                    We're working on bringing you the best items from <strong>{restaurant?.name || 'this restaurant'}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className={css.menuWrapper}>
            {!isAdmin && (
                <div className={css.categoryTabs}>
                    {categoryList.map(catName => (
                        <button
                            key={catName}
                            className={`${css.tabChip} ${activeCategory === catName ? css.activeTab : ''}`}
                            onClick={() => setActiveCategory(catName)}
                        >
                            {catName}
                        </button>
                    ))}
                </div>
            )}
            {displayCategories.map((cat, idx) => {
                const availability = checkAvailability(cat);
                const showItems = true; // Always show per new rule

                return (
                    <section key={idx} className={css.categorySection}>
                        <CategoryHeader
                            category={cat}
                            isAdmin={isAdmin}
                            onEdit={(newName) => onUpdateCategory(cat._originalIndex, newName)}
                            onDelete={() => onDeleteCategory(cat._originalIndex)}
                            onUpdateTiming={(timings) => onUpdateCategoryDetails(cat._originalIndex, { timings })}
                            onToggleClosure={(newIsManuallyClosed) => onUpdateCategoryDetails(cat._originalIndex, { isManuallyClosed: newIsManuallyClosed })}
                            onUpdateDetails={(details) => onUpdateCategoryDetails(cat._originalIndex, details)}
                        />
                        <div className={css.itemsGrid}>
                            {cat.items && cat.items.map((item, iIdx) => (
                                <MenuCard
                                    key={`${cat._originalIndex}-${item._originalIndex}`}
                                    item={{ ...item, categoryAvailability: availability }}
                                    restaurant={restaurant}
                                    restaurantName={restaurant.name}
                                    categoryName={cat.name}
                                    isOpen={isOpen}
                                    isAdmin={isAdmin}
                                    isAnyItemEditing={isAnyItemEditing}
                                    setIsAnyItemEditing={setIsAnyItemEditing}
                                    onEdit={(updatedItem) => onUpdateItem(cat._originalIndex, item._originalIndex, updatedItem)}
                                    onDelete={() => onDeleteItem(cat._originalIndex, item._originalIndex)}
                                    onImageClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => onImageUpload(cat._originalIndex, item._originalIndex, e.target.files[0]);
                                        input.click();
                                    }}
                                    loading="lazy"
                                />
                            ))}
                            {isAdmin && (
                                <MenuCardPlaceholder onAdd={() => onAddItem(cat._originalIndex)} />
                            )}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default DynamicRestaurantMenu;
