import css from './GetTheApp.module.css'
import mobileImg from '/images/mobile.png'
import phoneIcon from '/icons/smartphone.png'
import whatsappIcon from '/icons/message.png'
import { ADMIN_CONTACT } from '../../helpers/contact'
import { useAuth } from '../../context/AuthContext'

let GetTheApp = () => {
    const { isLoggedIn, triggerAuth } = useAuth();
    const phoneNumber = ADMIN_CONTACT.phone;
    const whatsappNumber = ADMIN_CONTACT.whatsapp;

    const handlePhoneCall = () => {
        if (!isLoggedIn) {
            triggerAuth(() => window.location.href = `tel:${phoneNumber}`, 'Please login to call and order');
            return;
        }
        window.location.href = `tel:${phoneNumber}`;
    };

    const handleWhatsApp = () => {
        if (!isLoggedIn) {
            triggerAuth(() => {
                const message = encodeURIComponent(ADMIN_CONTACT.whatsappMsg);
                window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
            }, 'Please login to order via WhatsApp');
            return;
        }
        const message = encodeURIComponent(ADMIN_CONTACT.whatsappMsg);
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    };

    return <div className={css.outerDiv}>
        <div className={css.innerDiv}>
            <div className={css.leftSec}>
                <img className={css.mobileImg} src={mobileImg} alt="mobile img" />
            </div>
            <div className={css.rightSec}>
                <div className={css.title}>Order from FoodRiders</div>
                <div className={css.tag}>Place your order easily through phone call or WhatsApp</div>

                <div className={css.orderOptions}>
                    <button className={css.orderButton} onClick={handlePhoneCall}>
                        <img className={css.icon} src={phoneIcon} alt="phone" />
                        <div className={css.buttonContent}>
                            <div className={css.buttonTitle}>Call to Order</div>
                            <div className={css.buttonSubtitle}>{phoneNumber}</div>
                        </div>
                    </button>

                    <button className={css.orderButton} onClick={handleWhatsApp}>
                        <img className={css.icon} src={whatsappIcon} alt="whatsapp" />
                        <div className={css.buttonContent}>
                            <div className={css.buttonTitle}>Order via WhatsApp</div>
                            <div className={css.buttonSubtitle}>Quick & Easy</div>
                        </div>
                    </button>
                </div>

                <div className={css.infoBox}>
                    <div className={css.infoTitle}>Why order with us?</div>
                    <div className={css.infoList}>
                        <div className={css.infoItem}>✓ Fast delivery to your doorstep</div>
                        <div className={css.infoItem}>✓ Fresh and quality food</div>
                        <div className={css.infoItem}>✓ Easy payment options</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default GetTheApp;
