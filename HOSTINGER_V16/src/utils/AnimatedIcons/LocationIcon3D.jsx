import React from 'react';
import css from './LocationIcon3D.module.css';

const LocationIcon3D = () => {
  return (
    <div className={css.container}>
      <div className={css.pin}>
        <div className={css.pinTop}></div>
        <div className={css.pinBottom}></div>
      </div>
      <div className={css.pulse}></div>
    </div>
  );
};

export default LocationIcon3D;
