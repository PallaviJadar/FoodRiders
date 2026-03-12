import { useState, useEffect } from 'react'
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import socket from '../utils/socket';
import { isRestaurantOpen } from '../utils/RestaurantUtils/timeUtils';
import css from './RestaurantPage.module.css'

import NavigationBar from '../components/Navbars/NavigationBar.jsx'
import MobileNavbar from '../components/Navbars/MobileNavbar.jsx';
import DownloadAppUtil from '../utils/RestaurantUtils/DownloadAppUtil.jsx'
import OrderTitleComponent from '../components/RestaurantComponents/OrderTitleComponent.jsx'
import OrderBodyComponent from '../components/RestaurantComponents/OrderBodyComponent.jsx'
import DeveloperFooter from '../components/Footer/DeveloperFooter'
// import { isRestaurantOpen } from '../utils/RestaurantUtils/timeUtils' (Removed duplicate)

import { restaurants } from '../helpers/constants'

import { Helmet } from 'react-helmet-async';

const RestaurantPage = () => {
  const { hotel } = useParams();
  const location = useLocation();
  const [restaurantData, setRestaurantData] = useState(location.state?.restaurantInfo || null);
  const [toogleMenu, setToggleMenu] = useState(true);
  const queryParams = new URLSearchParams(location.search);
  const [searchTerm, setSearchTerm] = useState(location.state?.search || queryParams.get('search') || "");

  const fetchDynamicRestaurant = React.useCallback(async () => {
    try {
      console.log(`[RestaurantPage] 🔄 Fetching fresh data for: ${hotel}`);
      const res = await fetch(`/api/restaurants/slug/${hotel}`);
      if (!res.ok) throw new Error('Restaurant not found');
      const data = await res.json();
      setRestaurantData(data);
    } catch (err) {
      console.error('Failed to fetch dynamic restaurant', err);
    }
  }, [hotel]);

  // 1. Initial Fetch
  useEffect(() => {
    if (hotel) {
      fetchDynamicRestaurant();
    }
  }, [hotel, fetchDynamicRestaurant]);

  // 2. Real-time Sync
  useEffect(() => {
    const handleRestaurantUpdate = (update) => {
      // Check if update is for this restaurant
      const currentId = restaurantData?._id;
      if (currentId && update.id === currentId) {
        console.log(`[RestaurantPage] 📡 Live status update for: ${hotel}`);
        fetchDynamicRestaurant();
      } else if (!currentId) {
        // Fallback if we haven't loaded the ID yet
        fetchDynamicRestaurant();
      }
    };

    socket.on('restaurantUpdate', handleRestaurantUpdate);
    return () => {
      socket.off('restaurantUpdate', handleRestaurantUpdate);
    };
  }, [hotel, fetchDynamicRestaurant, restaurantData?._id]);

  // Default values if data not found (or while loading)
  const displayData = restaurantData || {
    name: hotel ? hotel.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Restaurant",
    cuisine: "Indian Cuisine",
    address: "Mahalingapura, Karnataka 587312",
    timing: "10am - 11pm (Today)",
    isDynamic: !!restaurantData?._id // Marker for dynamic restaurants
  };

  if (!toogleMenu) {
    return <MobileNavbar setToggleMenu={setToggleMenu} toogleMenu={toogleMenu} />
  }

  const restaurantStatus = isRestaurantOpen(restaurantData);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": displayData.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": displayData.address,
      "addressLocality": "Mahalingapura",
      "addressRegion": "Karnataka",
      "postalCode": "587312",
      "addressCountry": "IN"
    },
    "geo": displayData.location ? {
      "@type": "GeoCoordinates",
      "latitude": displayData.location.lat,
      "longitude": displayData.location.lng
    } : undefined,
    "image": displayData.image ? `/uploads/${displayData.image}` : undefined,
    "url": window.location.href,
    "servesCuisine": displayData.cuisine || "Indian"
  };

  return <div className={css.outerDiv}>
    <Helmet>
      <title>{displayData.name} - Order Online | FoodRiders Mahalingapura</title>
      <meta name="description" content={`Order delicious food from ${displayData.name} in Mahalingapura. View menu, prices, and fast delivery options. ${displayData.cuisine || 'Best food in town'}.`} />
      <link rel="canonical" href={window.location.href} />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
    <NavigationBar toogleMenu={toogleMenu} setToggleMenu={setToggleMenu} />
    {/* Show title component for all restaurants */}
    <OrderTitleComponent
      name={displayData.name}
      cuisine={displayData.cuisine}
      address={displayData.address || "Mahalingapura, Karnataka 587312"}
      timing={restaurantStatus.badgeText}
      isOpen={restaurantStatus.isOpen}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    />
    <div className={css.innerDiv2}>
      <OrderBodyComponent
        restaurantData={restaurantData}
        searchTerm={searchTerm}
        isOpen={restaurantStatus.isOpen}
      />
    </div>
    <DeveloperFooter />
  </div>
}

export default RestaurantPage
