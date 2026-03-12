import React from 'react'
import css from './OrderTitleComponent.module.css'

import infoIcon from '/icons/info.png'
import locationIcon from '/icons/location.png'
import clockIcon from '/icons/clock.png'

const OrderTitleComponent = ({
  name = "Restaurant Name",
  cuisine = "Cuisines",
  address = "Mahalingapura, Karnataka 587312",
  timing = "10am - 11pm (Today)",
  isOpen = true,
  searchTerm = "",
  setSearchTerm = () => { }
}) => {
  return <div className={css.outerDiv}>
    <div className={css.innerDiv}>
      <div className={css.left}>
        <div className={css.title}>{name}</div>
        <div className={css.specials}>{cuisine}</div>
        <div className={css.address}>
          <img src={locationIcon} className={css.smallIcon} alt="location" />
          {address}
        </div>
        <div className={css.timings}>
          <img src={clockIcon} className={css.smallIcon} alt="clock" />
          <span className={`${css.statusBadge} ${isOpen ? css.open : css.closed}`}>
            {timing}
          </span>
          <span className={css.infoIconBox}>
            <img className={css.infoIcon} src={infoIcon} />
            <div className={css.infoTooltip}>
              <div className={css.ttil}>Opening Hours</div>
              <div className={css.ttim}>Mon-Sun:<span className={css.ctim}>11:30am-10:30pm</span></div>
            </div>
          </span>
        </div>
      </div>
      <div className={css.right}>
        <div className={css.searchWrapper}>
          <span className={css.searchIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            type="text"
            className={css.searchInput}
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className={css.clearBtn} onClick={() => setSearchTerm("")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  </div>;
}

export default OrderTitleComponent
