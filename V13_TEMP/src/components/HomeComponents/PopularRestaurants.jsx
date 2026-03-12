import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import css from './PopularRestaurants.module.css';

const PopularRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/restaurants')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRestaurants(data);
        } else {
          console.error('Expected array of restaurants', data);
        }
      })
      .catch(err => console.error('Error fetching restaurants:', err));
  }, []);

  const handleRestaurantClick = (restaurant) => {
    // Navigate to restaurant page using slug or ID
    const slug = restaurant.name.toLowerCase().replace(/ /g, '-');
    navigate(`/restaurant/${slug}`);
  };

  return (
    <div className={css.container}>
      <h2 className={css.heading}>Popular restaurants to<span className={css.orderText}>Order</span></h2>

      <div className={css.restaurantGrid}>
        {restaurants.length > 0 ? (
          restaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className={css.restaurantItem}
              onClick={() => handleRestaurantClick(restaurant)}
              style={{ cursor: 'pointer' }}
            >
              <div className={css.restaurantInfo}>
                <h3 className={css.restaurantName}>{restaurant.name}</h3>
                <span className={css.restaurantType}>
                  {Array.isArray(restaurant.tags) && restaurant.tags.length > 0
                    ? restaurant.tags.join(', ')
                    : (restaurant.type || 'Multi-Cuisine')}
                </span>
              </div>
              <div className={css.arrowIcon}>›</div>
            </div>
          ))
        ) : (
          <div className={css.loadingText}>Loading available restaurants...</div>
        )}

        {/* Only show Load More if really needed, simplified for now */}
        {restaurants.length > 6 && (
          <div className={css.seeMoreContainer}>
            <button className={css.seeMoreButton}>see more</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularRestaurants;
