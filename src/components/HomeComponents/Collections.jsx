import css from './Collections.module.css'

import rightArrow from '/icons/right-arrow.png'
// You may want to replace these with appropriate restaurant images
import restaurantIcon from '/icons/restaurantIcon.png'

import CollectionsCard from '../../utils/Cards/card2/CollectionsCard'

let Collections = () => {
    return <div className={css.outerDiv}>
        <div className={css.title}>Restaurants</div>
        <div className={css.tagLine}>
            <span className={css.desc}>Explore our curated lists of top restaurants in different categories</span>
            <span className={css.collectionPlacesTag}>All restaurants <span className={css.rightArrowBox}><img className={css.rightArrow} src={rightArrow} alt="right arrow" /></span></span>
        </div>
        <div className={css.cards}>
            <CollectionsCard imgSrc={restaurantIcon} title="Pure Veg" places="10" 
                description="Foodriders Cafe, Dwaraka Restaurant, Malasa Mangally Hotel, Aras Grand, Gokul Hotel, Shankar Idli Center, Davanagere Bennedose Center, Prabhu Malabadi Khanavali, Basaveshwar Lingayat Khanavali, Hundekar Khanavali" />
            <CollectionsCard imgSrc={restaurantIcon} title="Veg & Nonveg Hotels" places="2" 
                description="Manish Restaurant, U K Dhaba" />
            <CollectionsCard imgSrc={restaurantIcon} title="Bakery" places="1" 
                description="Cakewala Bakery" />
        </div>
    </div>
}

export default Collections;
