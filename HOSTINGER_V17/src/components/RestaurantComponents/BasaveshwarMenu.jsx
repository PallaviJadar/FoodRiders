import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const BasaveshwarMenu = () => {
  return (
    <div className={css.menuContainer}>
      <div className={css.header}>
        <h1>ಬಸವೇಶ್ವರ ಲಿಂಗಾಯತ ಖಾನಾವಳಿ ಮೆನು</h1>
      </div>
      <div className={css.menuSection}>
        <CategoryHeader title="ಮದ್ಯಹನ್ ಸಮಯ 12:45 To 2:50" categoryKey="Lunch" />
        <div className={css.menuGrid}>
          {lunchMenu.map((item, idx) => (
            <MenuCard
              key={idx}
              item={item}
              restaurantName="Basaveshwar Khanavali"
              categoryName="Lunch"
            />
          ))}
        </div>
      </div>
      <div className={css.menuSection}>
        <CategoryHeader title="ರಾತ್ರಿ ಊಟ ಸಮಯ 7:45 ರಿಂದ 10:45" categoryKey="Dinner" />
        <div className={css.menuGrid}>
          {dinnerMenu.map((item, idx) => (
            <MenuCard
              key={idx}
              item={item}
              restaurantName="Basaveshwar Khanavali"
              categoryName="Dinner"
            />
          ))}
        </div>
        <div className={css.note}>ರಾತ್ರಿ ರೊಟ್ಟಿ ಊಟ ಸಿಗಲ್ಲ</div>
      </div>
    </div>
  );
};

export default BasaveshwarMenu;
