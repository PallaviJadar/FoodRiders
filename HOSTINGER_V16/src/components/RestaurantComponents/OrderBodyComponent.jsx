import { useState, useEffect } from 'react'
import { NavLink, useParams } from "react-router-dom"

import css from './OrderBodyComponent.module.css'

import MenuComponent from './Components/MenuComponent.jsx'

const OrderBodyComponent = ({ restaurantData, searchTerm, isOpen }) => {

    const [pageCompo, setPageComp] = useState("")

    const { city, hotel, page = "" } = useParams();

    const isActiveClass = (e) => {
        if (e?.isActive) {
            return [css.menuTxt, css.menuTxtActive].join(" ");
        } else {
            return css.menuTxt;
        }
    }

    useEffect(() => {
        // Default to MenuComponent for all routes or specifically for menu
        setPageComp(<MenuComponent restaurantData={restaurantData} searchTerm={searchTerm} isOpen={isOpen} />);
    }, [city, hotel, page, restaurantData, searchTerm, isOpen])


    return <div className={css.outerDiv}>
        <div className={css.innerDiv}>
            <div className={css.menu}>
                <NavLink to={`/${city}/${hotel}/menu`} className={isActiveClass}>
                    Menu
                </NavLink>
            </div>
            <div className={css.componentsBody}>
                {pageCompo}
            </div>
        </div>
    </div>
}

export default OrderBodyComponent
