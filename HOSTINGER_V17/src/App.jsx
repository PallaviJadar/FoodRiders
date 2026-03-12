import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePageBanner from './components/HomeComponents/HomePageBanner.jsx'

import css from './App.module.css'

// Lazy load non-critical sections
const AnnouncementCarousel = lazy(() => import('./components/HomeComponents/AnnouncementCarousel.jsx'))
const FoodCategoryCarousel = lazy(() => import('./components/HomeComponents/FoodCategoryCarousel.jsx'))
const FeaturedRestaurant = lazy(() => import('./components/HomeComponents/FeaturedRestaurant.jsx'))
const PopularPlaces = lazy(() => import('./components/HomeComponents/PopularPlaces.jsx'))
const GetTheApp = lazy(() => import('./components/HomeComponents/GetTheApp.jsx'))
const ExploreOptionsNearMe = lazy(() => import('./components/HomeComponents/ExploreOptionsNearMe.jsx'))
const OwnerFooter = lazy(() => import('./components/Footer/OwnerFooter.jsx'))
const DeveloperFooter = lazy(() => import('./components/Footer/DeveloperFooter.jsx'))
const HomePopup = lazy(() => import('./components/HomeComponents/HomePopup.jsx'));



import { Helmet } from 'react-helmet-async';

function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FoodDeliveryService",
    "name": "FoodRiders",
    "areaServed": {
      "@type": "City",
      "name": "Mahalingapura"
    },
    "description": "Fastest food delivery service in Mahalingapura. Order from top local restaurants online.",
    "url": "https://www.foodriders.in"
  };

  return (
    <>
      <Helmet>
        <title>FoodRiders - Order Food Online in Mahalingapura</title>
        <meta name="description" content="Order food online from top restaurants in Mahalingapura. Fast delivery, live tracking, and great offers. Support local business!" />
        <meta name="keywords" content="food delivery mahalingapura, online food order, restaurants mahalingapura, food riders, home delivery" />
        <link rel="canonical" href="https://www.foodriders.in/" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <HomePageBanner />
      <div className={css.bodySize}>
        <Suspense fallback={<div style={{ height: '100px' }} />}>
          <AnnouncementCarousel />
        </Suspense>
        <Suspense fallback={<div style={{ height: '200px' }} />}>
          <FoodCategoryCarousel />
          <FeaturedRestaurant />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
          <PopularPlaces />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <GetTheApp />
        <ExploreOptionsNearMe />
        <OwnerFooter />
        <DeveloperFooter />
        <HomePopup />
      </Suspense>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Admin routes moved to main.jsx */}
      {/* <Route path="/admin" element={<AdminLogin />} /> */}
      {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
      {/* <Route path="/admin/restaurants" element={<AdminRestaurants />} /> */}
    </Routes>
  )
}

export default App
