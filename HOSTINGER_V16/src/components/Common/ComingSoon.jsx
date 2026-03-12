import React from 'react';
import { useNavigate } from 'react-router-dom';
import css from './ComingSoon.module.css';

// Using a generic food icon for now, ideally this would be a 3D asset if available

const ComingSoon = ({ title = "Coming Soon", message = "We're cooking up something special! This page is currently under construction." }) => {
    const navigate = useNavigate();

    return (
        <div className={css.container}>
            <div className={css.blob1}></div>
            <div className={css.blob2}></div>

            <div className={css.content}>
                {/* Fallback to text emoji if image not found or just use generic food theme */}
                <div className={css.illustration} style={{ fontSize: '100px', margin: '0 auto 20px' }}>
                    👨‍🍳
                </div>

                <h1 className={css.title}>{title}</h1>
                <p className={css.description}>
                    {message}
                </p>

                <div className={css.button} onClick={() => navigate('/')}>
                    Go Back Home
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
