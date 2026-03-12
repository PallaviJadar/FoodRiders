import css from './DeveloperFooter.module.css';
import instaIcon from '/icons/insta.png';
import mailIcon from '/icons/mail.png';

const DeveloperFooter = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={css.footer}>
            <div className={css.container}>
                <div className={css.content}>
                    <span className={css.text}>
                        Made with <span className={css.heart}>❤️</span> by <span className={css.brand}>DevXign</span>
                    </span>
                    <div className={css.links}>
                        <a
                            href="https://www.instagram.com/devxign.tech/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css.link}
                        >
                            <img src={instaIcon} alt="Instagram" className={css.icon} />
                        </a>
                        <a
                            href="mailto:devxign.tech@gmail.com"
                            className={css.link}
                        >
                            <img src={mailIcon} alt="Email" className={css.icon} />
                        </a>
                    </div>
                    <span className={css.copyright}>© {currentYear} FoodRiders</span>
                </div>
            </div>
        </footer>
    );
};

export default DeveloperFooter;
