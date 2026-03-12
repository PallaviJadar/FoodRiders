import React from 'react';
import css from './OwnerFooter.module.css';
import { ADMIN_CONTACT } from '../../helpers/contact';
import CommunityStats from './CommunityStats';
import { useAuth } from '../../context/AuthContext';

const OwnerFooter = () => {
    const { isLoggedIn, triggerAuth } = useAuth();
    return (
        <div className={css.ownerFooterContainer}>
            <CommunityStats />
            <div className={css.contentWrapper}>
                <div className={css.brandSection}>
                    <img src="/Logo-Img.png" alt="Food Riders" className={css.footerLogo} />
                    <h2 className={css.brandName}>Food Riders</h2>
                    <p className={css.foundedInfo}>EST. 2019</p>
                </div>

                <div className={css.bioSection}>
                    <h3 className={css.sectionTitle}>Our Journey</h3>
                    <p className={css.bioText}>
                        Started with a passion for bringing the best local flavors to your doorstep.
                        Food Riders isn't just a delivery service; it's a community of food lovers
                        committed to speed, quality, and the joy of dining. We bridge the gap between
                        your cravings and the finest kitchens in Mahalingapura.
                    </p>
                </div>

                <div className={css.socialSection}>
                    <h3 className={css.sectionTitle}>Connect With Us</h3>
                    <div className={css.socialIcons}>
                        <a href="https://www.instagram.com/foodriders.in/" className={css.iconLink} aria-label="Instagram">
                            <img src="/icons/insta.png" alt="Instagram" />
                        </a>

                        <a href="https://www.youtube.com/@Foodriders222" className={css.iconLink} aria-label="YouTube">
                            <img src="/icons/yt.png" alt="YouTube" />
                        </a>

                        <a href="https://www.facebook.com/share/17Cufybx1X/?mibextid=wwXIfr" className={css.iconLink} aria-label="Facebook">
                            <img src="/icons/fb.png" alt="Facebook" />
                        </a>

                        <a href={`https://wa.me/${ADMIN_CONTACT.whatsapp}`}
                            className={css.iconLink}
                            aria-label="WhatsApp"
                            onClick={(e) => {
                                if (!isLoggedIn) {
                                    e.preventDefault();
                                    triggerAuth(() => window.location.href = `https://wa.me/${ADMIN_CONTACT.whatsapp}`, 'Please login to contact support');
                                }
                            }}
                        >
                            <img src="/icons/whtsp.png" alt="WhatsApp" />
                        </a>


                    </div>
                </div>
            </div>
            <div className={css.separator}></div>
        </div>
    );
};

export default OwnerFooter;
