import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import css from './SearchBar.module.css'

import downArrow from '/icons/down-arrow1.png'
import searchIcon from '/icons/search.png'
import LocationIcon3D from './AnimatedIcons/LocationIcon3D'

let SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            navigate(`/show-case?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <div className={css.outerDiv}>
            <div className={css.srch1}>
                <div className={css.iconBox}>
                    <LocationIcon3D />
                </div>
                <input
                    type="text"
                    placeholder="Place.."
                    className={css.inpt}
                    defaultValue="Mahalingapura"
                />
                <div className={css.iconBox}>
                    <img className={css.downArrow} src={downArrow} alt="down arrow" />
                </div>
            </div>
            <hr className={css.hr} />
            <div className={css.srch2}>
                <div className={css.iconBox} onClick={() => searchTerm.trim() && navigate(`/show-case?search=${encodeURIComponent(searchTerm.trim())}`)}>
                    <img className={css.icon} src={searchIcon} alt="search icon" />
                </div>
                <input
                    type="text"
                    placeholder='Search for restaurant, cuisine or a dish'
                    className={css.inpt}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>
        </div>
    );
}

export default SearchBar;
