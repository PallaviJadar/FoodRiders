import React from 'react';
import RestaurantCard from '../../utils/Cards/RestaurantCard.jsx';
import css from './RestaurantList.module.css';

// Sample data - replace with your actual data source
const restaurantsData = [
  {
    id: 1,
    image: '/images/food1.jpg',
    name: 'Satkar Restaurant',
    rating: 4.1,
    cuisines: ['North Indian', 'Chinese', 'South Indian'],
    price: 150,
    deliveryTime: 19,
    discount: 50,
    promoted: true
  },
  {
    id: 2,
    image: '/images/food2.jpg',
    name: 'Apni Rasoi Family Dhaba',
    rating: 4.2,
    cuisines: ['Pizza', 'North Indian', 'Italian'],
    price: 150,
    deliveryTime: 24,
    discount: null,
    promoted: false
  },
  {
    id: 3,
    image: '/images/food3.jpg',
    name: "Dino's Pizza",
    rating: 3.8,
    cuisines: ['Pizza', 'Burger', 'Desserts'],
    price: 150,
    deliveryTime: 45,
    discount: 20,
    promoted: true
  }
];

const RestaurantList = () => {
  return (
    <div className={css.container}>
      <div className={css.header}>
        <h2 className={css.title}>Restaurants near you</h2>
        <div className={css.filters}>
          <button className={css.filterButton}>
            <span className={css.filterIcon}>⚙️</span> Filters
          </button>
          <button className={css.filterOption}>Pure Veg</button>
          <button className={css.filterOption}>
            Cuisines <span className={css.dropdownIcon}>▼</span>
          </button>
        </div>
      </div>
      <div className={css.restaurantGrid}>
        {restaurantsData.map(restaurant => (
          <RestaurantCard 
            key={restaurant.id}
            id={restaurant.id}
            image={restaurant.image}
            name={restaurant.name}
            rating={restaurant.rating}
            cuisines={restaurant.cuisines}
            price={restaurant.price}
            deliveryTime={restaurant.deliveryTime}
            discount={restaurant.discount}
            promoted={restaurant.promoted}
          />
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;
