import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import css from './ShowcasePage.module.css';

import NavigationBar from '../components/Navbars/NavigationBar.jsx';
import MobileNavbar from '../components/Navbars/MobileNavbar.jsx';
import Footer from '../components/Footer/DeveloperFooter';
import PlacesCard from '../utils/Cards/card3/PlacesCard';
import { useRedirect } from '../utils/redirectHandler';

const ShowcasePage = () => {
    const [toogleMenu, setToggleMenu] = useState(true);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { handleRedirect, normalizeRedirectItem } = useRedirect();

    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');

    // For non-search routes (like "Coming Soon"), we can keep existing logic or redirect
    const pageType = queryParams.get('page');

    const { categoryGroup } = useParams(); // From /category/:categoryGroup

    useEffect(() => {
        let url = '';
        if (searchQuery) {
            url = `/api/search?q=${encodeURIComponent(searchQuery)}`; // Use NEW Global Search API
        } else if (categoryGroup) {
            url = `/api/restaurants?categoryGroup=${encodeURIComponent(categoryGroup)}`;
        }

        if (url) {
            setLoading(true);
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    setResults(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Fetch failed:", err);
                    setLoading(false);
                });
        }
    }, [searchQuery, categoryGroup]);

    const handleResultClick = (item) => {
        const normalized = normalizeRedirectItem(item);
        handleRedirect(normalized.redirectType, normalized.redirectTarget, normalized.parentId);
    };

    // Helper for Card Link (Fallback if user right clicks)
    const getLink = (item) => {
        if (item.type === 'restaurant' || !item.type) {
            return `/restaurant/${item._id || item.id}`;
        }
        return '#';
    };

    if (!toogleMenu) {
        return <MobileNavbar setToggleMenu={setToggleMenu} toogleMenu={toogleMenu} />
    }

    return (
        <div className={css.outerDiv}>
            <NavigationBar toogleMenu={toogleMenu} setToggleMenu={setToggleMenu} />

            <div className={css.content}>
                {loading ? (
                    <div className={css.loader}>Finding delicious matches...</div>
                ) : (
                    <>
                        <h2 className={css.heading}>
                            {searchQuery ? `Results for "${searchQuery}"` : "Explore"}
                        </h2>

                        {results.length > 0 ? (
                            <div className={css.grid}>
                                {results.map(r => (
                                    <div key={r.id || r._id} className={css.cardWrapper} onClick={() => handleResultClick(r)}>
                                        <PlacesCard
                                            place={r.name}
                                            count={
                                                r.type === 'menu_item' ? `Menu Item (in ${r.parentName || 'Restaurant'})` :
                                                    r.type === 'category' ? 'Category Group' :
                                                        r.badge ? `Offer: ${r.badge} Active` :
                                                            `${r.rating || 4.2} ★ • ${r.deliveryTime || 30} mins`
                                            }
                                            miniImg={r.image ? (r.image.startsWith('http') ? r.image : `/uploads/${r.image}`) : null}
                                            link={getLink(r)}
                                        />
                                        {r.badge && <div className={css.offerBadge}>{r.badge}</div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={css.noResults}>
                                <img src="/images/search-empty.png" alt="" className={css.emptyImg} onError={(e) => e.target.style.display = 'none'} />
                                <p>No restaurants or offers found matching "{searchQuery}". Try "Dosa", "Pizza", or "Nandini".</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default ShowcasePage;
