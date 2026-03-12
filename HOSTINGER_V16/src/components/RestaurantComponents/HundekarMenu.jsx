import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const HundekarMenu = () => {
  return (
    <div className={css.menuContainer}>
      <div className={css.header}>
        <h1>Hundekar Khanavali Menu</h1>
      </div>
      <div className={css.menuSection}>
        <CategoryHeader title="Daily Meals" categoryKey="Meals" />
        <div className={css.menuGrid}>
          {menu.map((item, idx) => (
            <MenuCard
              key={idx}
              item={item}
              restaurantName="Hundekar Khanavali"
              categoryName="Meals"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HundekarMenu;
