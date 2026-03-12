import React from 'react';
import css from './StoreClosed.module.css';

const StoreClosed = () => {
    return (
        <div className={css.closedWrapper}>
            <div className={css.contentCard}>
                <div className={css.neonSign}>CLOSED</div>
                <h1>We're taking a short break! 🌙</h1>
                <p>
                    FoodRiders is currently offline for orders.
                    Our delivery partners are recharging to serve you better.
                </p>
                <div className={css.divider}></div>
                <p className={css.subtext}>Please check back soon!</p>
            </div>
        </div>
    );
};

export default StoreClosed;
