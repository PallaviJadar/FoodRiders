import css from './ShowMore.module.css';

import downArrow from '/icons/down-arrow.png';

let ShowMore = ({ setShowMore, showMore }) => {
    return <div onClick={() => setShowMore(val => !val)} className={css.card}>
        <div className={css.innerBox}>
            <div className={css.place}>{showMore ? 'See less' : 'See more'}</div>
            <img
                className={`${css.arrow} ${showMore ? css.rotated : ''}`}
                src={downArrow}
                alt={showMore ? "up arrow" : "down arrow"}
            />
        </div>
    </div>
}

export default ShowMore;
