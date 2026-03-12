import { useState, useEffect } from 'react';
import React from 'react';
import socket from '../../utils/socket';
import { isRestaurantOpen } from '../../utils/RestaurantUtils/timeUtils';

import PlacesCard from '../../utils/Cards/card3/PlacesCard'
import ShowMore from '../../utils/Cards/card3/ShowMore'

import css from './PopularPlaces.module.css';

let PopularPlaces = () => {
    let [showMore, setShowMore] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [categoryGroups, setCategoryGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [dietaryFilter, setDietaryFilter] = useState(null); // null, 'Veg', or 'Non Veg'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Groups
        fetch('/api/home-sections/groups')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCategoryGroups(data);
            })
            .catch(err => console.error("Failed to fetch groups:", err));

        // Fetch Restaurants (Initial)
        fetchRestaurants('All');

        // 📡 Real-time Restaurant Updates
        const handleStatusUpdate = (update) => {
            console.log(`[PopularPlaces] 📡 Real-time update received for: ${update.id}`);
            // Force a refresh to sync availability stickers/visibility
            fetchRestaurants(selectedGroup, true);
        };

        socket.on('restaurantUpdate', handleStatusUpdate);
        return () => {
            socket.off('restaurantUpdate', handleStatusUpdate);
        };
    }, [selectedGroup]);

    const isFetching = React.useRef(false);
    const lastDataHash = React.useRef("");

    const fetchRestaurants = (group, forced = false) => {
        if (isFetching.current && !forced) return;
        isFetching.current = true;

        let url = '/api/restaurants';
        if (group && group !== 'All') {
            url += `?categoryGroup=${encodeURIComponent(group)}`;
        }

        // Only show spinner if we have no restaurants displayed yet
        if (restaurants.length === 0) setLoading(true);

        console.log(`[PopularPlaces] Fetching from: ${url}`);
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const currentHash = JSON.stringify(data);
                if (currentHash !== lastDataHash.current) {
                    console.log(`[PopularPlaces] Data changed, updating UI`);
                    lastDataHash.current = currentHash;
                    setRestaurants(Array.isArray(data) ? data : []);
                }
            })
            .catch(err => {
                console.error("[PopularPlaces] Fetch failed:", err);
            })
            .finally(() => {
                setLoading(false);
                isFetching.current = false;
            });
    };

    const handleFilter = (group) => {
        if (selectedGroup === group) return;
        setSelectedGroup(group);
        fetchRestaurants(group);
        setShowMore(false);
    };

    const handleDietaryToggle = (type) => {
        if (dietaryFilter === type) {
            setDietaryFilter(null); // Toggle off
        } else {
            setDietaryFilter(type);
        }
    };

    // Filter results in real-time based on diet
    const filteredResults = restaurants.filter(r => {
        if (!dietaryFilter) return true;

        // Safety check for empty arrays
        const bridge = Array.isArray(r.bridgeCategories) ? r.bridgeCategories : [];
        const tags = Array.isArray(r.tags) ? r.tags : [];

        const combined = [...bridge, ...tags].map(t => String(t).toLowerCase());

        const filterStr = dietaryFilter.toLowerCase();
        // Match 'veg' or 'non veg'
        return combined.some(t => t.includes(filterStr));
    });

    const initial = filteredResults.slice(0, 6);
    const rest = filteredResults.slice(6);

    const getLink = (name, id) => {
        return `/restaurant/${name.toLowerCase().trim().replace(/ +/g, '-')}`;
    };

    return <div className={css.outerDiv}>
        <div className={css.title}><span className={css.titleTxt}>Popular restaurants to</span> <span className={css.bld}>Order</span></div>

        <div className={css.filterHeader}>
            {/* Real-time Dietary Switches */}
            <div className={css.dietarySwitches}>
                <div
                    className={`${css.dietSwitch} ${dietaryFilter === 'Veg' ? css.vegActive : ''}`}
                    onClick={() => handleDietaryToggle('Veg')}
                >
                    <div className={css.dot} style={{ borderColor: '#00B138' }}><div className={css.innerDot} style={{ background: '#00B138' }}></div></div>
                    <span>Veg</span>
                </div>
                <div
                    className={`${css.dietSwitch} ${dietaryFilter === 'Non Veg' ? css.nonVegActive : ''}`}
                    onClick={() => handleDietaryToggle('Non Veg')}
                >
                    <div className={css.dot} style={{ borderColor: '#E43536' }}><div className={css.triangle} style={{ borderBottomColor: '#E43536' }}></div></div>
                    <span>Non-Veg</span>
                </div>
            </div>

            <div className={css.divider}></div>

            {/* Category Group Filters */}
            <div className={css.filterScroll}>
                <button
                    onClick={() => handleFilter('All')}
                    className={`${css.filterPill} ${selectedGroup === 'All' ? css.activePill : ''}`}
                >
                    All Sections
                </button>
                {categoryGroups.map(group => (
                    <button
                        key={group._id}
                        onClick={() => handleFilter(group.name)}
                        className={`${css.filterPill} ${selectedGroup === group.name ? css.activePill : ''}`}
                    >
                        {group.name}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <p>Loading restaurants...</p>
            </div>
        ) : filteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥗</div>
                <h3>No {dietaryFilter || ''} restaurants found in this section</h3>
                <p>Try switching to "All" or choosing another category.</p>
            </div>
        ) : (
            <div className={css.placesCards}>
                {initial.map(r => {
                    const status = isRestaurantOpen(r);
                    return (
                        <PlacesCard
                            key={r._id}
                            place={r.name}
                            count={`${status.badgeText} • ${r.rating} ★ • ${r.deliveryTime} m`}
                            link={getLink(r.name, r._id)}
                            miniImg={
                                r.image
                                    ? (r.image.startsWith('http') || r.image.startsWith('data:')
                                        ? r.image
                                        : `/uploads/${r.image}`)
                                    : null
                            }
                        />
                    );
                })}

                {showMore && rest.map(r => {
                    const status = isRestaurantOpen(r);
                    return (
                        <PlacesCard
                            key={r._id}
                            place={r.name}
                            count={`${status.badgeText} • ${r.rating} ★ • ${r.deliveryTime} m`}
                            link={getLink(r.name, r._id)}
                            miniImg={
                                r.image
                                    ? (r.image.startsWith('http') || r.image.startsWith('data:')
                                        ? r.image
                                        : `/uploads/${r.image}`)
                                    : null
                            }
                        />
                    );
                })}

                {rest.length > 0 && <ShowMore setShowMore={setShowMore} showMore={showMore} />}
            </div>
        )}
    </div>
}

export default PopularPlaces;
