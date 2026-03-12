import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';


const foodridersCafeMenu = {
  "classicPizza": {
    "American Pizza": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/American Pizza.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Mexican Pizza": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/Mexican Pizza.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Panjabi Tashan": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/Panjabi Tashan.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Schezwan Delight": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/Schezwan Delight.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Paneer Tika Pizza": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/Paneer Tika Pizza.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "The Maya": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/The Maya.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Margherita": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/Margherita.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Veg Delight": {
      "description": "Delicious pizza with fresh toppings",
      "image": "/images/restaurants/foodriders-cafe/Veg Delight.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Fingerchips": {
      "description": "Crispy and salty finger chips",
      "image": "/images/restaurants/foodriders-cafe/Snacks & Beverages/Fingerchips.png",
      "prices": {
        "small": 40,
        "medium": 80,
        "large": 120
      }
    },
    "Red Chilli Pasta": {
      "description": "Spicy red chilli pasta",
      "image": "/images/restaurants/foodriders-cafe/Snacks & Beverages/Red Chilly Paasta.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    },
    "Coffee (Bru)": {
      "description": "Hot Bru Coffee",
      "image": "/images/restaurants/foodriders-cafe/Snacks & Beverages/Coffee.png",
      "prices": {
        "small": 40,
        "medium": 50,
        "large": 60
      }
    },
    "Paasta": {
      "description": "Creamy pasta",
      "image": "/images/restaurants/foodriders-cafe/Snacks & Beverages/Paasta.png",
      "prices": {
        "small": 149,
        "medium": 259,
        "large": 399
      }
    }
  },
  "snacks": {
    "Water": 40,
    "Fingerchips": 40,
    "Paasta": 40,
    "Red Chilly Paasta": 40,
    "Coffee": 40
  }
};

const FoodridersMenu = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Logic
  const filteredPizzas = Object.entries(foodridersCafeMenu.classicPizza).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSnacks = Object.entries(foodridersCafeMenu.snacks).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={css.menuContainer}>
      <motion.div
        className={css.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Foodriders Cafe Menu</h1>
      </motion.div>

      {/* Search Bar */}
      <div className={css.searchContainer}>
        <input
          type="text"
          placeholder="Search for pizza, snacks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={css.searchInput}
        />
        <span className={css.searchIcon}>🔍</span>
      </div>

      {/* Only show section if it has matching items */}
      {filteredPizzas.length > 0 && (
        <div className={css.menuSection}>
          <CategoryHeader title="Classic Pizza" categoryKey="Pizza" />
          <div className={css.menuGrid}>
            {filteredPizzas.map(([name, details]) => {
              // Convert prices object to sizes array for MenuCard
              const sizes = Object.entries(details.prices).map(([size, price]) => ({
                size: size.charAt(0).toUpperCase() + size.slice(1),
                price
              }));
              return (
                <MenuCard
                  key={name}
                  item={{ ...details, name, sizes }}
                  restaurantName="Foodriders Cafe"
                  categoryName="Pizza"
                />
              );
            })}
          </div>
        </div>
      )}

      {filteredSnacks.length > 0 && (
        <div className={css.menuSection}>
          <CategoryHeader title="Snacks & Beverages" categoryKey="Snacks" />
          <div className={css.menuGrid}>
            {filteredSnacks.map(([name, price]) => {
              const item = { name };
              if (typeof price === 'object') {
                item.sizes = Object.entries(price).map(([size, p]) => ({
                  size: size.charAt(0).toUpperCase() + size.slice(1),
                  price: p
                }));
              } else {
                item.price = price;
              }
              return (
                <MenuCard
                  key={name}
                  item={item}
                  restaurantName="Foodriders Cafe"
                  categoryName="Snacks"
                />
              );
            })}
          </div>
        </div>
      )}

      {filteredPizzas.length === 0 && filteredSnacks.length === 0 && (
        <div className={css.noResults}>
          <h3>No items found for "{searchTerm}"</h3>
          <p>Try searching for something else like "Margherita" or "Coffee"</p>
        </div>
      )}
    </div>
  );
};

export default FoodridersMenu;
