import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import css from './DwarakaMenu.module.css';
import MenuCard from '../../utils/RestaurantUtils/MenuCard.jsx';
import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const DwarakaMenuContent = () => {
  console.log('DwarakaMenu: Rendering started...');
  const { addToCart, setIsCartOpen } = useCart();

  // Menu data with combined items for size variations
  const menuData = {
    "hotBeverages": [
      {
        "name": "BLACK TEA",
        "price": 20,
        "image": "/images/restaurants/dwaraka/hotbeverages/black tea.jpg"
      },
      {
        "name": "SPECIAL TEA",
        "price": 25,
        "image": "/images/restaurants/dwaraka/hotbeverages/special tea.jpg"
      },
      {
        "name": "LEMON TEA",
        "price": 25,
        "image": "/images/restaurants/dwaraka/hotbeverages/lemon tea.jpg"
      },
      {
        "name": "GINGER TEA",
        "price": 25,
        "image": "/images/restaurants/dwaraka/hotbeverages/ginger tea.jpg"
      },
      {
        "name": "FILTER COFFEE",
        "price": 25,
        "image": "/images/restaurants/dwaraka/hotbeverages/ginger tea.jpg"
      },
      {
        "name": "BLACK COFFEE",
        "price": 20,
        "image": "/images/restaurants/dwaraka/hotbeverages/black cofee.jpg"
      },
      {
        "name": "BOURNVITA",
        "price": 25,
        "image": "/images/restaurants/dwaraka/hotbeverages/bournvita.jpg"
      },
      {
        "name": "MILK PLAIN",
        "price": 25,
        "image": "/images/restaurants/dwaraka/hotbeverages/milk plain.jpg"
      },
      {
        "name": "BADAM MILK",
        "price": 30,
        "image": "/images/restaurants/dwaraka/hotbeverages/Badam milk.jpg"
      }
    ],
    "breakfastSouthIndian": [
      {
        "name": "IDLI",
        "sizes": [
          {
            "size": "S",
            "price": 22
          },
          {
            "size": "P",
            "price": 40
          }
        ],
        "image": "/images/restaurants/dwaraka/breakfast/idli.jpg"
      },
      {
        "name": "IDLI VADA",
        "sizes": [
          {
            "size": "S",
            "price": 50
          },
          {
            "size": "P",
            "price": 60
          }
        ],
        "image": "/images/restaurants/dwaraka/breakfast/idli vada.jpg"
      },
      {
        "name": "VADA",
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
        "image": "/images/restaurants/dwaraka/breakfast/Dahi vada.jpg"
      },
      {
        "name": "UPPITU",
        "price": 30,
        "image": "/images/restaurants/dwaraka/breakfast/uppittu.jpg"
      },
      {
        "name": "SHIRA",
        "price": 35,
        "image": "/images/restaurants/dwaraka/breakfast/Shira.jpg"
      },
      {
        "name": "CHOW CHOW BATH",
        "price": 60,
        "image": "/images/restaurants/dwaraka/breakfast/Chow Chow bath.jpg"
      },
      {
        "name": "KURMA PURI",
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
        "image": "/images/restaurants/dwaraka/breakfast/Kurma puri.jpg"
      },
      {
        "name": "ALU PURI",
        "sizes": [
          {
            "size": "S",
            "price": 40
          },
          {
            "size": "P",
            "price": 70
          }
        ],
        "image": "/images/restaurants/dwaraka/breakfast/Aloo Poori.jpg"
      },
      {
        "name": "DAHI VADA",
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
        "image": "/images/restaurants/dwaraka/breakfast/Dahi vada.jpg"
      },
      {
        "name": "MOSAR AVALAKKI",
        "price": 40,
        "image": "/images/restaurants/dwaraka/breakfast/Avalakki.jpg"
      },
      {
        "name": "PULAV",
        "price": 60,
        "image": "/images/restaurants/dwaraka/breakfast/Pulav.jpg"
      }
    ],
    "dosa": [
      {
        "name": "SADA DOSA",
        "price": 50,
        "image": "/images/restaurants/dwaraka/dosa/sada  dosa.jpg"
      },
      {
        "name": "MASALA DOSA (GHEE PUDI)",
        "price": 60,
        "image": "/images/restaurants/dwaraka/dosa/butter masala dosa.jpg"
      },
      {
        "name": "MYSORE MASALA DOSA",
        "price": 85,
        "image": "/images/restaurants/dwaraka/dosa/Mysore Masala Dosa.jpg"
      },
      {
        "name": "BUTTER MASALA DOSA",
        "price": 75,
        "image": "/images/restaurants/dwaraka/dosa/butter masala dosa.jpg"
      },
      {
        "name": "OPEN DOSA",
        "price": 65,
        "image": "/images/restaurants/dwaraka/dosa/open dosa.jpg"
      },
      {
        "name": "SET DOSA",
        "price": 65,
        "image": "/images/restaurants/dwaraka/dosa/set dosa.jpg"
      },
      {
        "name": "AKKI DOSA",
        "sizes": [
          {
            "size": "S",
            "price": 65
          },
          {
            "size": "P",
            "price": 65
          }
        ],
        "image": "/images/restaurants/dwaraka/dosa/akki dosa.jpg"
      },
      {
        "name": "ONION UTTAPA",
        "price": 35,
        "image": "/images/restaurants/dwaraka/dosa/onion uttappa.jpg"
      },
      {
        "name": "TOMATO OMLET",
        "price": 70,
        "image": "/images/restaurants/dwaraka/dosa/tomato omlet.jpg"
      },
      {
        "name": "RAVA DOSA",
        "price": 65,
        "image": "/images/restaurants/dwaraka/dosa/rava dosa.jpg"
      },
      {
        "name": "PANEER BUTTER MASALA DOSA",
        "price": 85,
        "image": "/images/restaurants/dwaraka/dosa/butter masala dosa.jpg"
      }
    ],
    "combos": [
      {
        "name": "DOSA/IDLI COMBO (SMALL MASALA DOSA + MINI IDLI + RAVA IDLY)",
        "price": 100,
        "image": "/images/restaurants/dwaraka/combos/dosa_idli_combo.png"
      },
      {
        "name": "DOSA COMBO (MASALA DOSA + MINI UTTAPA+ RAVA DOSA)",
        "price": 120,
        "image": "/images/restaurants/dwaraka/combos/dosa_combo.png"
      }
    ],
    "northIndian": {
      "salads": [
        {
          "name": "GREEN SALAD",
          "price": 40,
          "image": "/images/restaurants/dwaraka/salads/green_salad.png"
        },
        {
          "name": "FRENCH SALAD",
          "price": 50,
          "image": "/images/restaurants/dwaraka/salads/french_salad.png"
        },
        {
          "name": "RUSSIAN SALAD",
          "price": 50,
          "image": "/images/restaurants/dwaraka/salads/russian_salad.png"
        }
      ],
      "soups": [
        {
          "name": "TOMATO SOUP",
          "price": 75,
          "image": "/images/restaurants/dwaraka/soups/tomato_soup.png"
        },
        {
          "name": "VEG HOT AND SOUR SOUP",
          "price": 75,
          "image": "/images/restaurants/dwaraka/soups/hot_and_sour_soup.png"
        },
        {
          "name": "SWEET CORN SOUP",
          "price": 75,
          "image": "/images/restaurants/dwaraka/soups/sweet_corn_soup.png"
        },
        {
          "name": "VEG MANCHOW SOUP",
          "price": 75,
          "image": "/images/restaurants/dwaraka/soups/manchow_soup.png"
        },
        {
          "name": "LEMON CORINDER SOUP",
          "price": 85,
          "image": "/images/restaurants/dwaraka/soups/lemon_coriander_soup.png"
        },
        {
          "name": "VEG CLEAR SOUP",
          "price": 65,
          "image": "/images/restaurants/dwaraka/soups/clear_soup.png"
        },
        {
          "name": "CREAM OF MUSHROOM",
          "price": 100,
          "image": "/images/restaurants/dwaraka/soups/cream_of_mushroom.png"
        },
        {
          "name": "CREAM OF PALAK",
          "price": 80,
          "image": "/images/restaurants/dwaraka/soups/cream_of_palak.png"
        },
        {
          "name": "VEG HONTON NOODLES SOUP",
          "price": 80,
          "image": "/images/restaurants/dwaraka/soups/honton_noodles_soup.png"
        }
      ]
    },
    "quickBites": [
      {
        "name": "ROSTED PAPAD",
        "price": 25,
        "image": "/images/restaurants/dwaraka/quickbites/ROSTED PAPAD.jpg"
      },
      {
        "name": "MASALA PAPAD",
        "price": 40,
        "image": "/images/restaurants/dwaraka/quickbites/Masala Papad.jpg"
      },
      {
        "name": "PEANUT MASALA",
        "price": 55,
        "image": "/images/restaurants/dwaraka/quickbites/PEANUT MASALA.jpg"
      },
      {
        "name": "FRENCH FRIES",
        "price": 85,
        "image": "/images/restaurants/dwaraka/quickbites/FRENCH FRIES.jpg"
      },
      {
        "name": "PERI PERI FRIES",
        "price": 90,
        "image": "/images/restaurants/dwaraka/quickbites/PERI PERI FRIES.jpg"
      },
      {
        "name": "CHANNA GARLIC DRY",
        "price": 65,
        "image": "/images/restaurants/dwaraka/quickbites/CHANNA GARLIC DRY.jpg"
      }
    ],
    "tandoorStarters": {
      "paneerStarters": [
        {
          "name": "PANEER TIKKKA",
          "price": 220,
          "image": "/images/restaurants/dwaraka/biryani/Paneer tikka biryani.jpg"
        },
        {
          "name": "MALAI PANEER TIKKA",
          "price": 220,
          "image": "/images/restaurants/dwaraka/paneerstarters/MALAI PANEER TIKKA.jpg"
        },
        {
          "name": "PANEER HARIYALI",
          "price": 220,
          "image": "/images/restaurants/dwaraka/paneerstarters/PANEER HARIYALI.jpg"
        },
        {
          "name": "PANEER PAHADI",
          "price": 210,
          "image": "/images/restaurants/dwaraka/paneerstarters/PANEER PAHADI.jpg"
        },
        {
          "name": "ACHARI PANEER",
          "price": 210,
          "image": "/images/restaurants/dwaraka/paneerstarters/ACHARI PANEER.jpg"
        },
        {
          "name": "PANEER BANJARA TIKKA",
          "price": 210,
          "image": "/images/restaurants/dwaraka/paneerstarters/PANEER BANJARA TIKKA.jpg"
        }
      ],
      "mushroomStarters": [
        {
          "name": "MUSHROOM TIKKA",
          "price": 220,
          "image": "/images/restaurants/dwaraka/mushroomstarters/MUSHROOM TIKKA.jpg"
        },
        {
          "name": "HARIYALI MUSHROOM",
          "price": 230,
          "image": "/images/restaurants/dwaraka/breakfast/Shira.jpg"
        },
        {
          "name": "CHATPATI MUSHROOM",
          "price": 220,
          "image": "/images/restaurants/dwaraka/mushroomstarters/CHATPATI MASHROOM.jpg"
        },
        {
          "name": "MUSHROOM MULTANI TIKKA",
          "price": 250,
          "image": "/images/restaurants/dwaraka/mushroomstarters/MUSHROOM MULTANI TIKKA.jpg"
        }
      ],
      "vegKababStarters": [
        {
          "name": "TANDOORI ALU",
          "price": 210,
          "image": "/images/restaurants/dwaraka/vegstarters/TANDOORI ALOO.jpg"
        },
        {
          "name": "TANDOORI GOBI",
          "price": 210,
          "image": "/images/restaurants/dwaraka/vegstarters/TANDOORI GOBI.jpg"
        },
        {
          "name": "BABY CORN TIKKA",
          "price": 240,
          "image": "/images/restaurants/dwaraka/vegstarters/BABY CORN TIKKA.jpg"
        },
        {
          "name": "VEG SEEK KABAB",
          "price": 250,
          "image": "/images/restaurants/dwaraka/vegstarters/VEG SEEK KABAB.jpg"
        },
        {
          "name": "PANEER SEEK KABAB",
          "price": 270,
          "image": "/images/restaurants/dwaraka/vegstarters/PANEEER SEEK KABAB.jpg"
        },
        {
          "name": "CORN SEEK KABAB",
          "price": 260,
          "image": "/images/restaurants/dwaraka/vegstarters/CORN SEEK KABAB.jpg"
        },
        {
          "name": "VEG MAKMALI SEEK KABAB",
          "price": 280,
          "image": "/images/restaurants/dwaraka/vegstarters/VEG MAKMALAI SEEK KABAB.jpg"
        }
      ]
    },
    "smokySizzlers": [
      {
        "name": "PANEER SHASHLIK",
        "price": 320,
        "image": "/images/Food/Dwaraka/Smoky Sizzlers/paneer-shashlik.jpeg"
      },
      {
        "name": "CHINESE SIZZLER",
        "price": 340,
        "image": "/images/Food/Dwaraka/Smoky Sizzlers/chinese-sizzler.jpeg"
      },
      {
        "name": "SIZZLER PLATTER (5 TYPES OF TANDOORI STARTERS)",
        "price": 350,
        "image": "/images/Food/Dwaraka/Smoky Sizzlers/sizzler-platter.jpeg"
      },
      {
        "name": "VEG HOT PAN",
        "price": 250,
        "image": "/images/Food/Dwaraka/Smoky Sizzlers/veg-hot-pan.jpeg"
      },
      {
        "name": "PANNER HOT PAN",
        "price": 230,
        "image": "/images/Food/Dwaraka/Smoky Sizzlers/panner-hot-pan.jpeg"
      }
    ],
    "vegStarters": [
      {
        "name": "VEG CRISPY",
        "price": 130,
        "image": "/images/restaurants/dwaraka/vegstarters/VEG CRISPY.jpg"
      },
      {
        "name": "VEG BULLET",
        "price": 140,
        "image": "/images/restaurants/dwaraka/vegstarters/VEG BULLET.jpg"
      },
      {
        "name": "VEG BALLS",
        "price": 140,
        "image": "/images/restaurants/dwaraka/vegstarters/VEG BOLLS.jpg"
      },
      {
        "name": "VEG SPRING ROLL",
        "price": 150,
        "image": "/images/restaurants/dwaraka/vegstarters/VEG SPRING ROLLS.jpg"
      },
      {
        "name": "ONION PAKODA",
        "price": 35,
        "image": "/images/restaurants/dwaraka/vegstarters/ONION PAKODA.jpg"
      },
      {
        "name": "PALAK PAKODA",
        "price": 35,
        "image": "/images/restaurants/dwaraka/vegstarters/PALAK PAKODA.jpg"
      },
      {
        "name": "HARABHARA KABAB",
        "price": 170,
        "image": "/images/restaurants/dwaraka/vegstarters/HARABHARA KABAB.jpg"
      },
      {
        "name": "VEG MANCHURIAN",
        "price": 85,
        "image": "/images/Food/Dwaraka/Veg Starters/veg-manchurian.jpeg"
      },
      {
        "name": "VEG 65",
        "price": 80,
        "image": "/images/Food/Dwaraka/Veg Starters/veg-65.jpeg"
      },
      {
        "name": "VEG LOLIPOP (6 PIECES)",
        "price": 160,
        "image": "/images/restaurants/dwaraka/vegstarters/VEG LOLIPOP.jpg"
      }
    ],
    "gobiStarters": [
      {
        "name": "GOBI MANCHURIAN/GOBI 65",
        "price": 85,
        "image": "/images/restaurants/dwaraka/gobistarters/Gobi Manchurian or Gobi -65.jpg"
      },
      {
        "name": "GOBI CHILLI",
        "price": 90,
        "image": "/images/restaurants/dwaraka/gobistarters/Gobi chilli.jpg"
      }
    ],
    "paneerStartersChineseStyle": [
      {
        "name": "PANEER MANCHURIAN/ PANEER 65",
        "price": 150,
        "image": "/images/restaurants/dwaraka/chefspecial/PANNER MANCHURIAN.jpg"
      },
      {
        "name": "PANEER CHILLY / PANEER PEPPER DRY",
        "price": 150,
        "image": "/images/Food/Dwaraka/Paneer Starters Chinese Style/paneer-chilly.jpeg"
      },
      {
        "name": "PANEER SINGAPORI/ PANEER HONGKONG DRY",
        "price": 165,
        "image": "/images/Food/Dwaraka/Paneer Starters Chinese Style/paneer-singapore.jpeg"
      },
      {
        "name": "PANEER SATTE",
        "price": 180,
        "image": "/images/restaurants/dwaraka/chefspecial/PANEER USTAM.jpg"
      },
      {
        "name": "PANEER SPICY CORIANDER",
        "price": 170,
        "image": "/images/Food/Dwaraka/Paneer Starters Chinese Style/paneer-spicy-coriander.jpeg"
      }
    ],
    "mushroomStartersChineseStyle": [
      {
        "name": "MUSHROOM MANCHURIAN / MANCHURIAN 65",
        "price": 160,
        "image": "/images/restaurants/dwaraka/breakfast/Shira.jpg"
      },
      {
        "name": "MUSHROOM CHILLY / MUSHROOM PEPPER DRY",
        "price": 160,
        "image": "/images/restaurants/dwaraka/breakfast/Shira.jpg"
      }
    ],
    "babycornStarters": [
      {
        "name": "BABYCORN MANCHURIAN / BABYCORN 65",
        "price": 160,
        "image": "/images/Food/Dwaraka/Babycorn Starters/babycorn-manchurian.jpeg"
      },
      {
        "name": "BABYCORN CHILLY / BABYCORN PEPPER DRY",
        "price": 160,
        "image": "/images/Food/Dwaraka/Babycorn Starters/babycorn-chilly.jpeg"
      }
    ],
    "noodles": [
      {
        "name": "AMERICAN CHOPSY",
        "price": 120,
        "image": "/images/restaurants/dwaraka/noodles/AMERICAN CHOPSY.jpg"
      },
      {
        "name": "VEG HAKKA NOODLES",
        "price": 120,
        "image": "/images/restaurants/dwaraka/noodles/VEG HAKKA NOODLES.jpg"
      },
      {
        "name": "VEG SCHEZWAN NOODLES",
        "price": 130,
        "image": "/images/restaurants/dwaraka/noodles/VEG SCHEZWAN NOODLES.jpg"
      },
      {
        "name": "SINGAPORE NOODLES / HONGKONG NOODLES",
        "price": 130,
        "image": "/images/restaurants/dwaraka/noodles/SINGAPORE NOODLES+HONGKONG NOODLES.jpg"
      },
      {
        "name": "BROWN FRY CHILLY NOODLES",
        "price": 140,
        "image": "/images/restaurants/dwaraka/breakfast/idli.jpg"
      }
    ],
    "chineseCombo": [
      {
        "name": "VEG FRIED RICE + PANNER MANCHURIAN+ SMALL COLD DRINK",
        "price": 240,
        "image": "/images/restaurants/dwaraka/chinesecombo/VEG FRIED RICE + PANNER MANCHURIAN+SMALL COLD DRINK.jpg"
      },
      {
        "name": "VEG NOODLES+ FRIED RICE + COLD DRINK",
        "price": 230,
        "image": "/images/restaurants/dwaraka/chinesecombo/VEG NOODLES+ FRIED RICE + COLD DRINK.jpg"
      }
    ],
    "chefSpecialCurries": [
      {
        "name": "PANEER TIKKA LABADAR",
        "price": 220,
        "image": "/images/restaurants/dwaraka/chefspecial/PANEER TIKKA LABADAR.jpg"
      },
      {
        "name": "VEG BILAITI",
        "price": 220,
        "image": "/images/restaurants/dwaraka/vegstarters/VEG BULLET.jpg"
      },
      {
        "name": "PANEER BARAMATI",
        "price": 220,
        "image": "/images/restaurants/dwaraka/chefspecial/PANEER BARAMATI.jpg"
      },
      {
        "name": "VEG DEEWANI HANDI",
        "price": 200,
        "image": "/images/restaurants/dwaraka/chefspecial/VEG DEEWANI HANDI.jpg"
      },
      {
        "name": "METHI CHAMAN",
        "price": 170,
        "image": "/images/restaurants/dwaraka/chefspecial/METHI CHAMAN.jpg"
      },
      {
        "name": "KOFTA",
        "price": 180,
        "image": "/images/restaurants/dwaraka/chefspecial/KOFTA.jpg"
      },
      {
        "name": "PANEER CHINGARI",
        "price": 220,
        "image": "/images/restaurants/dwaraka/chefspecial/PANEER CHINGARI.jpg"
      },
      {
        "name": "PANEER LAHORI",
        "price": 220,
        "image": "/images/restaurants/dwaraka/chefspecial/PANEER LAHORI.jpg"
      },
      {
        "name": "PANEER USTAM",
        "price": 220,
        "image": "/images/restaurants/dwaraka/chefspecial/PANEER USTAM.jpg"
      },
      {
        "name": "DWARKA SPECIAL (3 DIFFERENT TYPES OF GRAVY)",
        "price": 530,
        "image": "/images/restaurants/dwaraka/chefspecial/DWARKA SPECIAL.jpg"
      },
      {
        "name": "JAIKA PUNJAB",
        "price": 220,
        "image": "/images/restaurants/dwaraka/chefspecial/JAIKA PUNJAB.jpg"
      }
    ],
    "vegMainCourse": [
      {
        "name": "VEG TAWA MASALA",
        "price": 200,
        "image": "/images/restaurants/dwaraka/maincourse/VEG TAWA MASALA.jpg"
      },
      {
        "name": "VEG KOFTA",
        "price": 190,
        "image": "/images/restaurants/dwaraka/maincourse/VEG KOFTA.jpg"
      },
      {
        "name": "VEG ANGARA",
        "price": 190,
        "image": "/images/restaurants/dwaraka/maincourse/VEG ANGARA.jpg"
      },
      {
        "name": "VEG HARIYALI",
        "price": 190,
        "image": "/images/restaurants/dwaraka/maincourse/VEG HARIYALI.jpg"
      },
      {
        "name": "VEG AFGANI",
        "price": 190,
        "image": "/images/restaurants/dwaraka/maincourse/VEG AFGANI.jpg"
      },
      {
        "name": "VEG JAIPURI",
        "price": 190,
        "image": "/images/restaurants/dwaraka/maincourse/VEG JAIPURI.jpg"
      },
      {
        "name": "VEG KHEEMA MASALA",
        "price": 180,
        "image": "/images/restaurants/dwaraka/maincourse/VEG KHEEMA MASALA.jpg"
      },
      {
        "name": "VEG CHILI VILLI",
        "price": 160,
        "image": "/images/restaurants/dwaraka/maincourse/VEG CHILLI VILLI.jpg"
      },
      {
        "name": "VEG PATIYALA",
        "price": 180,
        "image": "/images/restaurants/dwaraka/breakfast/uppittu.jpg"
      }
    ],
    "dalAluCurries": [
      {
        "name": "DAL MAKHANI",
        "price": 120,
        "image": "/images/restaurants/dwaraka/breakfast/idli.jpg"
      },
      {
        "name": "DAL TADAKA / FRY/ PALAK/KOLHAPURI",
        "price": 130,
        "image": "/images/restaurants/dwaraka/breakfast/idli.jpg"
      },
      {
        "name": "ALOO GOBI / MATAR/ PALAK",
        "price": 120,
        "image": "/images/Food/Dwaraka/Dal Alu Curries/aloo-gobi.jpeg"
      },
      {
        "name": "ALU MUSHROOM",
        "price": 150,
        "image": "/images/restaurants/dwaraka/breakfast/Shira.jpg"
      }
    ],
    "paneerCurries": [
      {
        "name": "PANEER KADAI/ KOLHAPURI/ MASALA/ HYDERABADI",
        "price": 170,
        "image": "/images/Food/Dwaraka/Paneer Curries/paneer-kadai.jpeg"
      },
      {
        "name": "PANEER BUTTER MASALA/ MAKHANWALA",
        "price": 180,
        "image": "/images/restaurants/dwaraka/dosa/paneer butter masala.jpg"
      },
      {
        "name": "PANEER TIKKA MASALA",
        "price": 190,
        "image": "/images/restaurants/dwaraka/paneerstarters/PANEER TIKKA.jpg"
      },
      {
        "name": "PANEER KAJU MASALA",
        "price": 190,
        "image": "/images/Food/Dwaraka/Paneer Curries/paneer-kaju-masala.jpeg"
      },
      {
        "name": "PANEER TOOFANI",
        "price": 200,
        "image": "/images/Food/Dwaraka/Paneer Curries/paneer-toofani.jpeg"
      }
    ],
    "rice": [
      {
        "name": "MASALA RICE",
        "price": 130,
        "image": "/images/Food/Dwaraka/Rice/masala-rice.jpeg"
      },
      {
        "name": "CURD RICE",
        "price": 100,
        "image": "/images/restaurants/dwaraka/rice/Curd Rice.jpg"
      },
      {
        "name": "SPCL CURD RICE",
        "price": 120,
        "image": "/images/restaurants/dwaraka/rice/Curd Rice.jpg"
      },
      {
        "name": "GHEE RICE",
        "price": 130,
        "image": "/images/restaurants/dwaraka/rice/GHEE RICE.jpg"
      }
    ],
    "chineseRice": [
      {
        "name": "ONION CHILLY FRIED RICE",
        "price": 130,
        "image": "/images/restaurants/dwaraka/chefspecial/FRIED RICE.jpg"
      },
      {
        "name": "BURNT GARLIC FRIED RICE",
        "price": 170,
        "image": "/images/restaurants/dwaraka/rice/BURNT GARLIC FRIED RICE.jpg"
      },
      {
        "name": "MUSHROOM FRIED RICE",
        "price": 140,
        "image": "/images/restaurants/dwaraka/chefspecial/FRIED RICE.jpg"
      },
      {
        "name": "TRIPLE SCHEZWAN RICE",
        "price": 190,
        "image": "/images/restaurants/dwaraka/rice/TRIPLE SCHEZWAN RICE.jpg"
      },
      {
        "name": "PANEER FRIED RICE",
        "price": 140,
        "image": "/images/restaurants/dwaraka/rice/Paneer Fried Rice.jpg"
      },
      {
        "name": "SINGAPORE / HONGKONG RICE",
        "price": 150,
        "image": "/images/Food/Dwaraka/Chinese Rice/singapore-rice.jpeg"
      }
    ],
    "biryani": [
      {
        "name": "MUSHROOM BIRYANI",
        "price": 150,
        "image": "/images/restaurants/dwaraka/biryani/Mashroom Biriyani.jpg"
      },
      {
        "name": "PANEER BIRYANI",
        "price": 150,
        "image": "/images/restaurants/dwaraka/biryani/Paneer Biriyani.jpg"
      },
      {
        "name": "PANEER TIKKA BIRYANI",
        "price": 160,
        "image": "/images/restaurants/dwaraka/biryani/Paneer tikka biryani.jpg"
      },
      {
        "name": "VEG BIRYANI",
        "price": 135,
        "image": "/images/restaurants/dwaraka/biryani/Veg biryani.jpg"
      },
      {
        "name": "HYDERABADI BIRYANI",
        "price": 160,
        "image": "/images/restaurants/dwaraka/biryani/Hyderabadi biriyani.jpg"
      }
    ],
    "raita": [
      {
        "name": "VEG RAITA",
        "price": 40,
        "image": "/images/restaurants/dwaraka/raita/Mix Veg Raita.jpg"
      },
      {
        "name": "BUNDI RAITA",
        "price": 50,
        "image": "/images/restaurants/dwaraka/raita/Boondi Raita.jpg"
      },
      {
        "name": "PINEAPPLE RAITA",
        "price": 50,
        "image": "/images/restaurants/dwaraka/raita/Pineapple Raita.jpg"
      }
    ]
  };

  const [searchTerm, setSearchTerm] = useState('');

  // Filter menu data based on search term
  const filterMenuData = (data, term) => {
    if (!term) return data;
    const lowerTerm = term.toLowerCase();

    const filtered = {};

    Object.keys(data).forEach(category => {
      const items = data[category];
      if (Array.isArray(items)) {
        // Handle array categories (most of them)
        const matchingItems = items.filter(item => item.name.toLowerCase().includes(lowerTerm));
        if (matchingItems.length > 0) {
          filtered[category] = matchingItems;
        }
      } else {
        // Handle object categories (like northIndian, tandoorStarters)
        const nestedFiltered = {};
        let hasNestedMatch = false;

        Object.keys(items).forEach(subCategory => {
          const subItems = items[subCategory];
          const matchingSubItems = subItems.filter(item => item.name.toLowerCase().includes(lowerTerm));
          if (matchingSubItems.length > 0) {
            nestedFiltered[subCategory] = matchingSubItems;
            hasNestedMatch = true;
          }
        });

        if (hasNestedMatch) {
          filtered[category] = nestedFiltered;
        }
      }
    });

    return filtered;
  };

  const filteredMenuData = filterMenuData(menuData, searchTerm);

  return (
    <div className={css.menuContainer}>
      <motion.div
        className={css.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>DWARKA VEG NON AC MENU</h1>
        <p className={css.disclaimer}>GOOD FOOD TAKES TIME, PLEASE GIVE US 20 MINS TO SERVE YOU, ORDER ONCE PLACED CANNOT BE CANCELLED</p>
      </motion.div>

      {/* Search Bar */}
      <div className={css.searchContainer}>
        <input
          type="text"
          placeholder="Search for idli, dosa, soup..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={css.searchInput}
        />
        <span className={css.searchIcon}>🔍</span>
      </div>

      {Object.keys(filteredMenuData).length === 0 && searchTerm && (
        <div className={css.noResults}>
          <h3>No items found for "{searchTerm}"</h3>
        </div>
      )}

      {/* Hot Beverages Section */}
      {filteredMenuData.hotBeverages && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>HOT BEVERAGES</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.hotBeverages.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Hot Beverages" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Breakfast / South Indian Section */}
      {filteredMenuData.breakfastSouthIndian && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <CategoryHeader title="BREAKFAST / SOUTH INDIAN" categoryKey="breakfastSouthIndian" />
          <div className={css.menuGrid}>
            {filteredMenuData.breakfastSouthIndian.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Breakfast" />
            ))}
          </div>
          <p className={css.note}>JAIN CHUTNEY AND SAMBAR ALSO AVAILABLE</p>
        </motion.div>
      )}

      {/* Dosa Section */}
      {filteredMenuData.dosa && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <CategoryHeader title="DOSA" categoryKey="dosa" />
          <div className={css.menuGrid}>
            {filteredMenuData.dosa.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Dosa" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Combos Section */}
      {filteredMenuData.combos && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CategoryHeader title="COMBOS" categoryKey="combos" />
          <div className={css.menuGrid}>
            {filteredMenuData.combos.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Combos" />
            ))}
          </div>
          <p className={css.note}>JAIN CHUTNEY AND SAMBAR ALSO AVAILABLE</p>
        </motion.div>
      )}

      {/* North Indian Section */}
      {filteredMenuData.northIndian && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <CategoryHeader title="NORTH INDIAN" categoryKey="northIndian" />

          {/* Salads */}
          {filteredMenuData.northIndian.salads && (
            <>
              <h3>SALADS</h3>
              <div className={css.menuGrid}>
                {filteredMenuData.northIndian.salads.map(item => (
                  <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Salads" />
                ))}
              </div>
            </>
          )}

          {/* Soups */}
          {filteredMenuData.northIndian.soups && (
            <>
              <h3>SOUPS</h3>
              <div className={css.menuGrid}>
                {filteredMenuData.northIndian.soups.map(item => (
                  <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Soups" />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Quick Bites Section */}
      {filteredMenuData.quickBites && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <CategoryHeader title="QUICK BITES" categoryKey="quickBites" />
          <div className={css.menuGrid}>
            {filteredMenuData.quickBites.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Quick Bites" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Tandoor Starters Section */}
      {filteredMenuData.tandoorStarters && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <CategoryHeader title="TANDOOR STARTERS" categoryKey="tandoorStarters" />

          {/* Paneer Starters */}
          {filteredMenuData.tandoorStarters.paneerStarters && (
            <>
              <h3>PANEER STARTERS</h3>
              <div className={css.menuGrid}>
                {filteredMenuData.tandoorStarters.paneerStarters.map(item => (
                  <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Paneer Starters" />
                ))}
              </div>
            </>
          )}

          {/* Mushroom Starters */}
          {filteredMenuData.tandoorStarters.mushroomStarters && (
            <>
              <h3>MUSHROOM STARTERS</h3>
              <div className={css.menuGrid}>
                {filteredMenuData.tandoorStarters.mushroomStarters.map(item => (
                  <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Mushroom Starters" />
                ))}
              </div>
            </>
          )}

          {/* Veg Kabab Starters */}
          {filteredMenuData.tandoorStarters.vegKababStarters && (
            <>
              <h3>VEG KABAB STARTERS</h3>
              <div className={css.menuGrid}>
                {filteredMenuData.tandoorStarters.vegKababStarters.map(item => (
                  <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Veg Kabab Starters" />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Smoky Sizzlers Section */}
      {filteredMenuData.smokySizzlers && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <CategoryHeader title="SMOKY SIZZLERS" categoryKey="smokySizzlers" />
          <div className={css.menuGrid}>
            {filteredMenuData.smokySizzlers.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Smoky Sizzlers" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Veg Starters Section */}
      {filteredMenuData.vegStarters && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <CategoryHeader title="VEG STARTERS" categoryKey="vegStarters" />
          <div className={css.menuGrid}>
            {filteredMenuData.vegStarters.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Veg Starters" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Gobi Starters Section */}
      {filteredMenuData.gobiStarters && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <CategoryHeader title="GOBI STARTERS" categoryKey="gobiStarters" />
          <div className={css.menuGrid}>
            {filteredMenuData.gobiStarters.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Gobi Starters" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Paneer Starters Chinese Style Section */}
      {filteredMenuData.paneerStartersChineseStyle && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <h2>PANEER STARTERS</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.paneerStartersChineseStyle.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Paneer Starters" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Mushroom Starters Chinese Style Section */}
      {filteredMenuData.mushroomStartersChineseStyle && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <h2>MUSHROOM STARTERS</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.mushroomStartersChineseStyle.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Mushroom Starters" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Babycorn Starters Section */}
      {filteredMenuData.babycornStarters && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <h2>BABYCORN STARTERS</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.babycornStarters.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Babycorn Starters" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Noodles Section */}
      {filteredMenuData.noodles && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <CategoryHeader title="NOODLES" categoryKey="noodles" />
          <div className={css.menuGrid}>
            {filteredMenuData.noodles.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Noodles" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Chinese Combo Section */}
      {filteredMenuData.chineseCombo && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <CategoryHeader title="CHINESE COMBO" categoryKey="chineseCombo" />
          <div className={css.menuGrid}>
            {filteredMenuData.chineseCombo.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Chinese Combo" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Chef Special Curries Section */}
      {filteredMenuData.chefSpecialCurries && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          <CategoryHeader title="CHEF SPECIAL CURRIES" categoryKey="chefSpecialCurries" />
          <div className={css.menuGrid}>
            {filteredMenuData.chefSpecialCurries.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Chef Special" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Veg Main Course Section */}
      {filteredMenuData.vegMainCourse && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <CategoryHeader title="VEG MAIN COURSE" categoryKey="vegMainCourse" />
          <div className={css.menuGrid}>
            {filteredMenuData.vegMainCourse.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Main Course" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Dal & Alu Curries Section */}
      {filteredMenuData.dalAluCurries && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
        >
          <h2>DAL & ALU CURRIES</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.dalAluCurries.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Dal and Alu Curries" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Paneer Curries Section */}
      {filteredMenuData.paneerCurries && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
        >
          <h2>PANEER CURRIES</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.paneerCurries.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Paneer Curries" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Rice Section */}
      {filteredMenuData.rice && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.1 }}
        >
          <CategoryHeader title="RICE" categoryKey="rice" />
          <div className={css.menuGrid}>
            {filteredMenuData.rice.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Rice" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Chinese Rice Section */}
      {filteredMenuData.chineseRice && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          <h2>CHINESE RICE</h2>
          <div className={css.menuGrid}>
            {filteredMenuData.chineseRice.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Chinese Rice" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Biryani Section */}
      {filteredMenuData.biryani && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 }}
        >
          <CategoryHeader title="BIRYANI" categoryKey="biryani" />
          <div className={css.menuGrid}>
            {filteredMenuData.biryani.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Biryani" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Raita Section */}
      {filteredMenuData.raita && (
        <motion.div
          className={css.menuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
        >
          <CategoryHeader title="RAITA" categoryKey="raita" />
          <div className={css.menuGrid}>
            {filteredMenuData.raita.map(item => (
              <MenuCard key={item.name} item={item} restaurantName="Dwaraka" categoryName="Raita" />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DwarakaMenu Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <h2>Something went wrong loading the menu.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', textAlign: 'left', background: '#fff0f0', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DwarakaMenu(props) {
  return (
    <ErrorBoundary>
      <DwarakaMenuContent {...props} />
    </ErrorBoundary>
  );
}
