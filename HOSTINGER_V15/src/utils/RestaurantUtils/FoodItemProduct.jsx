import { useState } from 'react'

import css from './FoodItemProduct.module.css'

import starGIcon from '/icons/starGIcon.png'
import starGrIcon from '/icons/starGrIcon.png'

import MenuImage from './MenuImage.jsx';

const FoodItemProduct = (props) => {
    let { ttl, votes, price, desc, vegNonveg, mustTry } = props.data;
    let dataset = props?.dataset;
    const [readMore, setReadMore] = useState(false)
    return <div className={css.outerDiv} data-id={dataset} id={props.id}>
        <div className={css.innerDiv}>
            <div className={css.imgBox}>
                <MenuImage
                    itemName={props.itemName || ttl}
                    categoryName={props.categoryName || "General"}
                    restaurantName={props.restaurantName || "General"}
                    src={props.data.image} // Pass image from data
                />
                <img src={vegNonveg} className={css.typeImg} alt='veg or nonveg' />
            </div>
            <div className={css.box}>
                <div className={css.ttl}>{ttl}</div>
                {mustTry ? <div className={css.tag}>MUST TRY</div> : ""}
                <div className={css.ratings}>
                    <div className={css.stars}>
                        <img src={starGIcon} className={css.starIcon} />
                        <img src={starGIcon} className={css.starIcon} />
                        <img src={starGIcon} className={css.starIcon} />
                        <img src={starGrIcon} className={css.starIcon} />
                        <img src={starGrIcon} className={css.starIcon} />
                    </div>
                    <div className={css.votesTxt}>{votes} votes</div>
                </div>
                <div className={css.price}>₹{price}</div>
                <div className={css.desc}>
                    {readMore ? desc : desc.substring(0, 100)}
                    ...
                    {!readMore ? <span className={css.readMore} onClick={() => setReadMore(true)}>read more</span> : ""}
                </div>
            </div>
        </div>
    </div>
}

export default FoodItemProduct
