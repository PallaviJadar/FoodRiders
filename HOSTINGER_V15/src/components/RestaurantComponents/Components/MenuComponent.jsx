import React from 'react';
import { useParams } from 'react-router-dom';
import { foodridersCafeMenu } from '../../../helpers/constants';
import FoodridersMenu from '../FoodridersMenu.jsx';
import DwarakaMenu from '../DwarakaMenu.jsx';
import BasaveshwarMenu from '../BasaveshwarMenu.jsx';
import HundekarMenu from '../HundekarMenu.jsx';
import ArasGrandMenu from '../ArasGrandMenu.jsx';
import MalasaMangalyaMenu from '../MalasaMangalyaMenu.jsx';
import ShankarIdliMenu from '../ShankarIdliMenu.jsx';
import DavanagereMenu from '../DavanagereMenu.jsx';
import NandiniMenu from '../NandiniMenu.jsx';
import DynamicRestaurantMenu from '../DynamicRestaurantMenu.jsx';

const MenuComponent = ({ restaurantData, searchTerm, isOpen }) => {
    const { hotel } = useParams();

    // Check if we have dynamic restaurant data from DB
    if (restaurantData && restaurantData._id) {
        return <DynamicRestaurantMenu restaurant={restaurantData} searchTerm={searchTerm} isOpen={isOpen} />;
    }

    // Default menu component for other restaurants
    // Show skeleton loaders while data is fetching
    return (
        <div style={{ padding: '2rem' }}>
            {/* Category Skeleton */}
            <div style={{
                height: '40px', background: '#f0f0f0', borderRadius: '10px',
                width: '60%', margin: '0 auto 2rem', animation: 'pulse 1.5s infinite'
            }}></div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div key={idx} style={{
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '1rem',
                        border: '1px solid #eee',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        animation: 'pulse 1.5s infinite'
                    }}>
                        {/* Image Skeleton */}
                        <div style={{ width: '100%', height: '180px', background: '#f5f5f5', borderRadius: '15px' }}></div>

                        {/* Text Skeletons */}
                        <div style={{ height: '24px', background: '#f0f0f0', borderRadius: '5px', width: '80%' }}></div>
                        <div style={{ height: '16px', background: '#f5f5f5', borderRadius: '5px', width: '60%' }}></div>
                        <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '5px', width: '40%', marginTop: 'auto' }}></div>

                        {/* Button Skeleton */}
                        <div style={{ height: '40px', background: '#e0e0e0', borderRadius: '25px', width: '100%', marginTop: '0.5rem' }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuComponent;
