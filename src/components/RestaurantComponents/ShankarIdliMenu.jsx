import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const ShankarIdliMenu = () => {
    const menuData = [
        {
            category: "Breakfast Specials",
            items: [
                {
                    name: '1 Plate Idli (3 Piece)',
                    price: 25,
                    description: "Soft and fluffy steamed rice cakes"
                },
                {
                    name: 'Uddin Vada',
                    price: 30,
                    description: "Crispy fried lentil donuts"
                }
            ]
        }
    ];

    return (
        <div className={css.menuContainer}>
            <div className={css.header}>
                <h1>Shankar Idli Center Menu</h1>
                <p>Authentic South Indian Breakfast</p>
            </div>

            {menuData.map((category, index) => (
                <div key={index} className={css.menuSection}>
                    <CategoryHeader title={category.category} categoryKey={category.category} />
                    <div className={css.menuGrid}>
                        {category.items.map((item, i) => (
                            <MenuCard
                                key={i}
                                item={{ ...item, restaurant: "Shankar Idli Center" }}
                                restaurantName="Shankar Idli Center"
                                categoryName={category.category}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ShankarIdliMenu;
