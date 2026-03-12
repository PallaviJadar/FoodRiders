import React from 'react';
import css from './ArasGrandMenu.module.css';
import MenuCard from '../../utils/RestaurantUtils/MenuCard.jsx';
import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const menuData = [
  {
    "title": "South Indian",
    "items": [
      {
        "name": "Idli",
        "sizes": [
          {
            "size": "S",
            "price": 25
          },
          {
            "size": "P",
            "price": 40
          }
        ],
        "image": "/images/restaurants/aras-grand/main/IDLI.jpg"
      },
      {
        "name": "Idlivada",
        "sizes": [
          {
            "size": "S",
            "price": 50
          },
          {
            "size": "P",
            "price": 65
          }
        ],
        "image": "/images/restaurants/aras-grand/main/IDLI VADA.jpg"
      },
      {
        "name": "Menduvada",
        "sizes": [
          {
            "size": "S",
            "price": 35
          },
          {
            "size": "P",
            "price": 60
          }
        ]
      },
      {
        "name": "Sheera",
        "price": 35,
        "image": "/images/restaurants/aras-grand/main/SHEERA.jpg"
      },
      {
        "name": "Uppit",
        "price": 30
      },
      {
        "name": "Dahivada",
        "sizes": [
          {
            "size": "S",
            "price": 35
          },
          {
            "size": "P",
            "price": 65
          }
        ],
        "image": "/images/restaurants/aras-grand/main/DAHI VADA.jpg"
      },
      {
        "name": "Puri Kurma",
        "sizes": [
          {
            "size": "S",
            "price": 35
          },
          {
            "size": "P",
            "price": 60
          }
        ],
        "image": "/images/restaurants/aras-grand/main/PURI KURMA.jpg"
      },
      {
        "name": "Palav",
        "price": 50,
        "image": "/images/restaurants/aras-grand/main/PALAV.jpg"
      },
      {
        "name": "Mosaru Avalakki",
        "price": 40
      }
    ]
  },
  {
    "title": "Dosa Items",
    "items": [
      {
        "name": "Sada Dosa",
        "price": 50,
        "image": "/images/restaurants/aras-grand/main/sada  dosa.jpg"
      },
      {
        "name": "Masala Dosa",
        "price": 60,
        "image": "/images/restaurants/aras-grand/main/masala dosa.jpg"
      },
      {
        "name": "Akki Dosa",
        "price": 65,
        "image": "/images/restaurants/aras-grand/main/AKKI DOSA.jpg"
      },
      {
        "name": "Mysore Masala",
        "price": 85
      },
      {
        "name": "Palak Masala",
        "price": 75,
        "image": "/images/restaurants/aras-grand/main/PALAK MASALA.jpg"
      },
      {
        "name": "Tomoto Omlet",
        "price": 80
      },
      {
        "name": "Onion Uttappa",
        "price": 65,
        "image": "/images/restaurants/aras-grand/main/onion uttappa.jpg"
      },
      {
        "name": "Rava Masala Dosa",
        "price": 80
      },
      {
        "name": "Set Dosa",
        "price": 65
      },
      {
        "name": "Cheese Masala Dosa",
        "price": 100
      },
      {
        "name": "Paneer Masala Dosa",
        "price": 110
      },
      {
        "name": "Paper Masala Dosa",
        "price": 90
      }
    ]
  },
  {
    "title": "Hot Beverages",
    "items": [
      {
        "name": "Tea",
        "price": 15
      },
      {
        "name": "Black Tea",
        "price": 15
      },
      {
        "name": "Special Tea",
        "price": 20
      },
      {
        "name": "Coffee",
        "price": 20
      },
      {
        "name": "Bournvita",
        "price": 25
      },
      {
        "name": "Hot Milk",
        "price": 20
      },
      {
        "name": "Black Coffee",
        "price": 15
      },
      {
        "name": "Ginger Tea",
        "price": 20
      },
      {
        "name": "Lemon Tea",
        "price": 20
      },
      {
        "name": "Badam Milk",
        "price": 30
      }
    ]
  },
  {
    "title": "Starters",
    "items": [
      {
        "name": "Gobi Manchurian/65",
        "price": 100
      },
      {
        "name": "Gobi Chilly/Pepper dry",
        "price": 110
      },
      {
        "name": "Babycorn Manchurian/65",
        "price": 120
      },
      {
        "name": "Mushroom Manchurian/65",
        "price": 130
      },
      {
        "name": "Paneer Manchurian/65",
        "price": 150
      },
      {
        "name": "Veg Bullet",
        "price": 120
      },
      {
        "name": "Veg Crispy",
        "price": 130
      },
      {
        "name": "Veg Spring Roll",
        "price": 140,
        "image": "/images/restaurants/aras-grand/specials/Veg Spring Roll.jpeg"
      },
      {
        "name": "Veg Momos",
        "price": 100,
        "image": "/images/restaurants/aras-grand/specials/Veg Momos.jpeg"
      },
      {
        "name": "Paneer Popcorn",
        "price": 160,
        "image": "/images/restaurants/aras-grand/specials/Paneer Popcorn.jpeg"
      }
    ]
  },
  {
    "title": "North Indian Dishes",
    "items": [
      {
        "name": "Veg Kadai/Handi/Kolhapuri/Hydrabadi",
        "price": 160
      },
      {
        "name": "Paneer Kolhapuri/Kadai/Masala",
        "price": 180
      },
      {
        "name": "Paneer Butter Masala",
        "price": 190
      },
      {
        "name": "Kaju Masala",
        "price": 190
      },
      {
        "name": "Dal Fry/Tadka",
        "price": 120
      },
      {
        "name": "Veg Patiyala",
        "price": 200
      }
    ]
  },
  {
    "title": "Rice Specials",
    "items": [
      {
        "name": "Veg Biriyani",
        "price": 135
      },
      {
        "name": "Paneer Biriyani",
        "price": 160
      },
      {
        "name": "Jeera Rice",
        "price": 110
      },
      {
        "name": "Ghee Rice",
        "price": 130
      },
      {
        "name": "Dal Kichdi",
        "price": 130
      },
      {
        "name": "Curd Rice",
        "price": 100
      }
    ]
  }
];

const ArasGrandMenu = () => {
  return (
    <div className={css.menuContainer}>
      <div className={css.header}>
        <h1>ARAS GRAND MENU</h1>
        <p className={css.subtitle}>Pure Veg Restaurant</p>
      </div>
      {menuData.map((section) => (
        <div className={css.menuSection} key={section.title}>
          <CategoryHeader title={section.title} categoryKey={section.title} />
          <div className={css.menuGrid}>
            {section.items.map((item) => (
              <MenuCard
                key={item.name}
                item={item}
                restaurantName="Aras Grand"
                categoryName={section.title}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArasGrandMenu;
