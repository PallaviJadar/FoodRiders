import React from 'react';
import css from './ProfileDrawer.module.css';
import ProfileContent from './ProfileContent';

const ProfileDrawer = ({ isOpen, onClose, onLogout }) => {
    if (!isOpen) return null;

    return (
        <div className={css.overlay} onClick={onClose}>
            <div className={css.drawer} onClick={e => e.stopPropagation()}>
                <div className={css.header}>
                    <div className={css.headerTitle}>User Account</div>
                    <button className={css.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={css.body}>
                    <ProfileContent onLogout={onLogout} closeParent={onClose} />
                </div>
            </div>
        </div>
    );
};

export default ProfileDrawer;
