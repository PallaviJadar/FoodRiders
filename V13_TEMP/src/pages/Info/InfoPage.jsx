import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbars/NavigationBar.jsx';
import DeveloperFooter from '../../components/Footer/DeveloperFooter';
import css from './InfoPage.module.css';

const InfoPage = () => {
    const { type } = useParams();

    const sections = {
        about: {
            title: "About FoodRiders",
            content: (
                <>
                    <p><strong>FoodRiders</strong> is Mahalingapura's premium food delivery service, bringing your favorite local flavors right to your doorstep.</p>
                    <p>Our mission is to support local businesses while providing a seamless, high-quality ordering experience for our community.</p>
                    <p>Founded with a passion for great food and even better service, we connect hungry customers with the best kitchens in town. Whether you're craving a late-night snack or a family feast, FoodRiders is here to deliver.</p>
                </>
            )
        },
        terms: {
            title: "Terms & Conditions",
            content: (
                <>
                    <h4>1. Acceptance of Terms</h4>
                    <p>By using FoodRiders, you agree to comply with our delivery policies and community guidelines.</p>
                    <h4>2. Ordering & Payment</h4>
                    <p>All orders are subject to availability. Payments can be made via UPI or Cash on Delivery.</p>
                    <h4>3. Cancellations</h4>
                    <p>Orders can only be cancelled before they are accepted by the restaurant. Once preparation starts, refunds are subject to our refund policy.</p>
                    <h4>4. Delivery</h4>
                    <p>We strive for timely delivery; however, times are estimates and may vary due to traffic or weather conditions.</p>
                </>
            )
        },
        privacy: {
            title: "Privacy Policy",
            content: (
                <>
                    <h4>Data Collection</h4>
                    <p>We collect your name, mobile number, and address to facilitate deliveries. This information is essential for ensuring your food reaches you correctly.</p>
                    <h4>Data Usage</h4>
                    <p>Your data is never sold to third parties and is only used for order processing, account management, and occasional promotional alerts (if opted in).</p>
                    <h4>Location Tracking</h4>
                    <p>We use your location only when the app is in use to provide accurate delivery tracking and restaurant suggestions near you.</p>
                    <h4>Security</h4>
                    <p>We implement industry-standard security measures to protect your personal information from unauthorized access.</p>
                </>
            )
        },
        help: {
            title: "Help & Support",
            content: (
                <>
                    <p>Need assistance with an order? We're here to help!</p>
                    <div className={css.helpOptions}>
                        <div className={css.helpCard}>
                            <h4>Live Chat</h4>
                            <p>Available 9 AM - 11 PM</p>
                            <button className={css.btn}>Start Chat</button>
                        </div>
                        <div className={css.helpCard}>
                            <h4>Call Us</h4>
                            <p>Immediate support via phone</p>
                            <a href="tel:9876543210" className={css.btn}>Call 9876543210</a>
                        </div>
                    </div>
                </>
            )
        }
    };

    const section = sections[type] || sections.about;

    return (
        <div className={css.outerDiv}>
            <Navbar />
            <div className={css.container}>
                <div className={css.sidebar}>
                    <Link to="/info/about" className={`${css.sideLink} ${type === 'about' ? css.active : ''}`}>About Us</Link>
                    <Link to="/info/terms" className={`${css.sideLink} ${type === 'terms' ? css.active : ''}`}>Terms & Conditions</Link>
                    <Link to="/info/privacy" className={`${css.sideLink} ${type === 'privacy' ? css.active : ''}`}>Privacy Policy</Link>
                    <Link to="/info/help" className={`${css.sideLink} ${type === 'help' ? css.active : ''}`}>Help & Support</Link>
                </div>
                <main className={css.content}>
                    <h1 className={css.title}>{section.title}</h1>
                    <div className={css.text}>
                        {section.content}
                    </div>
                </main>
            </div>
            <DeveloperFooter />
        </div>
    );
};

export default InfoPage;
