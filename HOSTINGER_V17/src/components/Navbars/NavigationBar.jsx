import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

import menuBar from '/icons/menu.png';
import downArrow from '/icons/down-arrow.png';
import profilePic from '/images/profilepic.jpg';

import ProfileDrawer from '.././Profile/ProfileDrawer';
import BackButton from '../../utils/RestaurantUtils/BackButton.jsx';
import SearchBar from '../../utils/SearchBar.jsx';
import css from './NavigationBar.module.css';

const CartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);


const NavigationBar = ({ setToggleMenu }) => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const { isLoggedIn, user, logout, triggerAuth } = useAuth();
    const { getCartCount, setIsCartOpen } = useCart();
    let [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const Logo = () => (
        <Link to='/' className={css.logoLink}>
            <img src="/Logo-Img.png" alt="FoodRiders" className={css.logoImage} />
        </Link>
    );

    return (
        <div className={`${css.navbar} ${isHomePage ? css.isHome : ''} ${scrolled ? css.scrolled : ''}`}>
            <div className={css.navbarInner}>
                {/* LEFT COLUMN: Logo on Home, BackBtn on Inner */}
                <div className={css.leftCol}>
                    <div className={css.logoAndBack}>
                        {!isHomePage && <BackButton className={css.navBackBtn} />}
                        <Logo />
                    </div>
                </div>

                {/* CENTER COLUMN: Search Bar Removed as per request */}
                <div className={css.centerCol}>
                </div>

                {/* RIGHT COLUMN: Actions + Hamburger */}
                <div className={css.rightActions}>
                    <div className={css.cartIcon} onClick={() => setIsCartOpen(true)}>
                        <CartIcon />
                        {getCartCount() > 0 && (
                            <span className={css.cartCount}>{getCartCount()}</span>
                        )}
                    </div>

                    <div className={css.desktopNav}>
                        <div className={css.profile} onClick={() => isLoggedIn ? setIsProfileOpen(true) : triggerAuth(() => setIsProfileOpen(true))}>
                            <img src={(isLoggedIn && user?.profilePic) ? user.profilePic : profilePic} alt="profile pic" className={css.profilePic} />
                            <div className={css.profileName}>
                                {isLoggedIn && user ? (user.fullName || user.fname || 'Profile') : 'Log in'}
                            </div>
                            <img src={downArrow} alt="arrow" className={css.arrow} />
                        </div>
                    </div>

                    {/* Mobile Hamburger Trigger */}
                    <div className={css.menuBar} onClick={() => setToggleMenu && setToggleMenu(val => !val)}>
                        <img src={menuBar} alt="menu" className={css.menuIcon} />
                    </div>
                </div>
            </div>

            <ProfileDrawer
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onLogout={logout}
            />
        </div>
    );
};

export default NavigationBar;
