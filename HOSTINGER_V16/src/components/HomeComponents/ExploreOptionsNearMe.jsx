import { motion } from 'framer-motion';
import css from './ExploreOptionsNearMe.module.css';
import starIcon from '/icons/star.png';

let ExploreOptionsNearMe = () => {
    const reviews = [
        {
            id: 1,
            name: "Rajesh Kumar",
            rating: 5,
            comment: "Amazing food quality and fast delivery! The biryani was absolutely delicious. Highly recommended!",
            date: "2 days ago"
        },
        {
            id: 2,
            name: "Priya Sharma",
            rating: 5,
            comment: "Best food delivery service in Mahalingapura. Fresh ingredients and great taste every time!",
            date: "1 week ago"
        },
        {
            id: 3,
            name: "Amit Patel",
            rating: 4,
            comment: "Good service and tasty food. Delivery was on time. Will definitely order again!",
            date: "3 days ago"
        },
        {
            id: 4,
            name: "Sneha Reddy",
            rating: 5,
            comment: "Excellent experience! The pizza was hot and fresh. Customer service is also very good.",
            date: "5 days ago"
        },
        {
            id: 5,
            name: "Vikram Singh",
            rating: 4,
            comment: "Great variety of restaurants to choose from. Food quality is consistently good.",
            date: "1 week ago"
        },
        {
            id: 6,
            name: "Ananya Desai",
            rating: 5,
            comment: "Love ordering from FoodRiders! Always fresh and delicious. The delivery boys are very polite.",
            date: "4 days ago"
        }
    ];

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <img
                key={index}
                src={starIcon}
                alt="star"
                className={index < rating ? css.starFilled : css.starEmpty}
                loading="lazy"
            />
        ));
    };

    return (
        <div className={css.outerDiv}>
            <div className={css.innerDiv}>
                <motion.div
                    className={css.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={css.title}>Customer Reviews</h2>
                    <p className={css.subtitle}>What our customers say about us</p>
                </motion.div>

                <div className={css.reviewsGrid}>
                    {reviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            className={css.reviewCard}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                        >
                            <div className={css.reviewHeader}>
                                <div className={css.userInfo}>
                                    <div className={css.avatar}>
                                        {review.name.charAt(0)}
                                    </div>
                                    <div className={css.userDetails}>
                                        <div className={css.userName}>{review.name}</div>
                                        <div className={css.reviewDate}>{review.date}</div>
                                    </div>
                                </div>
                                <div className={css.starsContainer}>
                                    {renderStars(review.rating)}
                                </div>
                            </div>
                            <p className={css.reviewComment}>{review.comment}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className={css.feedbackSection}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <h3 className={css.feedbackTitle}>Share Your Experience</h3>
                    <p className={css.feedbackSubtitle}>We'd love to hear from you!</p>
                    <div className={css.feedbackStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <motion.img
                                key={star}
                                src={starIcon}
                                alt="star"
                                className={css.feedbackStar}
                                whileHover={{ scale: 1.3, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                                loading="lazy"
                            />
                        ))}
                    </div>
                    <motion.a
                        href="https://www.google.com/search?sca_esv=a6656f2fff5d25f6&hl=en-IN&sxsrf=AE3TifNOHont_Cs3K7OdeNIU42HqjP-CWw:1766217929371&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E82QlUQxJkZCfsqwtcjghTG48yFwDxdE1pno3i_D67NCHzzaAv6hA1ctVxhxbKtqy7u98JVA4Zl04CmJWmHKW0FpQguv&q=FOOD+RIDER%27S+Reviews&sa=X&ved=2ahUKEwjMsprC2suRAxWOT2wGHbljLd4Q0bkNegQIJBAE&biw=633&bih=725&dpr=1.5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={css.feedbackButton}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'inline-block', textDecoration: 'none' }}
                    >
                        Write a Review
                    </motion.a>
                </motion.div>
            </div>
        </div>
    );
};

export default ExploreOptionsNearMe;
