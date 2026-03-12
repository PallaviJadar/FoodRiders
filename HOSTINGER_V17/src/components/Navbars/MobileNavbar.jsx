import React from 'react';
import { Link } from 'react-router-dom'
import css from './MobileNavbar.module.css';
import ProfileContent from '.././Profile/ProfileContent'
import { ADMIN_CONTACT } from '../../helpers/contact';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../utils/RestaurantUtils/BackButton.jsx';

let MobileNavbar = ({ toggleMenu, setToggleMenu }) => {
    const { isLoggedIn, logout, openLogin, openSignup } = useAuth();

    const logoutHandler = () => {
        logout();
        setToggleMenu(false);
    }

    return <>
        <div className={css.mobileMenu}>
            <div className={css.menu}>
                <BackButton className={css.mobileBackBtn} />
                <div className={css.menuBar} onClick={() => setToggleMenu(val => !val)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6L18 18" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <Link to='/' className={css.logoLink}>
                    <img src="/Logo-Img.png" alt="FoodRiders" className={css.logoImage} />
                </Link>
            </div>
            <div className={css.navbar}>
                {isLoggedIn ? (
                    <div className={css.profileWrapper}>
                        <ProfileContent onLogout={logoutHandler} closeParent={() => setToggleMenu(false)} />
                    </div>
                ) : (
                    <>
                        <div className={css.menuItem} onClick={() => openLogin()}>Log in</div>
                        <div className={css.menuItem} onClick={() => openSignup()}>Sign up</div>
                    </>
                )}
            </div>

            <div className={css.promoCard}>
                <div className={css.promoContent}>
                    <div className={css.promoTitle}>Get the App</div>
                    <div className={css.promoText}>Order faster with our mobile app!</div>
                </div>
                <img src="/icons/smartphone.png" alt="App" className={css.promoIcon} />
            </div>

            <div className={css.socialRow}>
                <a href="#" className={css.socialIcon}><img src="/icons/insta.png" alt="Instagram" /></a>
                <a href="#" className={css.socialIcon}><img src="/icons/fb.png" alt="Facebook" /></a>
                <a href="#" className={css.socialIcon}><img src="/icons/yt.png" alt="YouTube" /></a>
                <a href={`https://wa.me/${ADMIN_CONTACT.whatsapp}`} className={css.socialIcon}><img src="/icons/whtsp.png" alt="WhatsApp" /></a>
            </div>

            <div className={css.blob1}></div>
            <div className={css.blob2}></div>
        </div>
    </>
}

export default MobileNavbar;
