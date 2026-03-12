import React from 'react';
import { useNavigate } from 'react-router-dom';
import css from './Delivery404.module.css';

const Delivery404 = () => {
    const navigate = useNavigate();

    return (
        <div className={css.container}>
            <div className={css.content}>
                <div className={css.icon}>🚫</div>
                <h1 className={css.title}>Page Not Found</h1>
                <p className={css.message}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <button
                    className={css.button}
                    onClick={() => navigate('/delivery-dashboard')}
                >
                    Go to Delivery Dashboard
                </button>
                <button
                    className={css.secondaryButton}
                    onClick={() => navigate('/delivery-login')}
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default Delivery404;
