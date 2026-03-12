import React from 'react';
import { Link } from 'react-router-dom';
import css from './RestaurantCard.module.css';

const RestaurantCard = ({ 
  id,
  image, 
  name, 
  rating, 
  cuisines, 
  price, 
  deliveryTime,
  discount,
  promoted = false
}) => {
  return (
    <div className={css.cardContainer}>
      {promoted && <div className={css.promotedTag}>Promoted</div>}
      <div className={css.imageContainer}>
        <img src={image} alt={name} className={css.restaurantImage} />
        {discount && (
          <div className={css.discountBadge}>
            {discount}% OFF
          </div>
        )}
      </div>
      <div className={css.contentContainer}>
        <div className={css.restaurantName}>{name}</div>
        <div className={css.ratingContainer}>
          <div className={css.rating}>{rating}★</div>
        </div>
        <div className={css.cuisineContainer}>
          {cuisines.join(', ')}
        </div>
        <div className={css.footer}>
          <div className={css.price}>₹{price} for one</div>
          <div className={css.deliveryTime}>{deliveryTime} min</div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
