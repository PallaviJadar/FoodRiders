import React from 'react';
import { motion } from 'framer-motion';
import css from './DavanagereMenu.module.css';
import MenuCard from '../../utils/RestaurantUtils/MenuCard.jsx';
import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const DavanagereMenu = () => {
    const menuData = [
        {
            category: "Specialties",
            items: [
                {
                    name: 'Bennedose Single Piece',
                    price: 35,
                    description: "Classic Davanagere butter dosa"
                },
                {
                    name: 'Idli Plate',
                    price: 40,
                    description: "Soft steamed rice cakes"
                },
                {
                    name: 'Single Idliwada',
                    price: 45,
                    description: "1 Idli and 1 Vada combo"
                },
                {
                    name: 'Double Idliwada',
                    price: 65,
                    description: "2 Idlis and 1 Vada combo"
                },
                {
                    name: 'Paddu Plate (8 Piece)',
                    price: 40,
                    description: "Crispy rice batter dumplings"
                }
            ]
        }
    ];

    return (
        <div className={css.menuContainer}>
            <div className={css.header}>
                <h1>Davanagere Benne Dose Center</h1>
                <p>Famous Butter Dosas & South Indian Tiffins</p>
            </div>

            {menuData.map((category, index) => (
                <div key={index} className={css.menuSection}>
                    <CategoryHeader title={category.category} categoryKey={category.category} />
                    <div className={css.itemGrid}>
                        {category.items.map((item, i) => (
                            <MenuCard
                                key={i}
                                item={{ ...item, restaurant: "Davanagere Benne Dose Center" }}
                                restaurantName="Davanagere Benne Dose Center"
                                categoryName={category.category}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DavanagereMenu;
