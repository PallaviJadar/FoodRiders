import { Link } from 'react-router-dom';

import css from './PlacesCard.module.css';

import rightArrow from '/icons/right-arrow.png';

let PlacesCard = ({ place, count, link, miniImg }) => {
    return <Link to={link} className={css.card}>
        <div className={css.imgBox}>
            <img
                src={miniImg || '/images/Food/pizza.png'}
                alt={place}
                className={css.restaurantMiniImg}
                onError={(e) => { e.target.src = '/images/Food/pizza.png' }}
            />
        </div>
        <div className={css.innerBox}>
            <div className={css.place}>{place}</div>
            <div className={css.count}>{count}</div>
        </div>
        <div className={css.arrowBox}>
            <img className={css.arrow} src={rightArrow} alt="right arrow" />
        </div>
    </Link>
}

export default PlacesCard;
