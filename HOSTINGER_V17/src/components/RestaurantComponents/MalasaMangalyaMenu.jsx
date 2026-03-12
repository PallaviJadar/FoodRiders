import css from './MalasaMangalyaMenu.module.css';
import MenuCard from '../../utils/RestaurantUtils/MenuCard.jsx';
import CategoryHeader from '../../utils/RestaurantUtils/CategoryHeader.jsx';

const menuData = [
  {
    title: 'Hot Beverages',
    items: [
      { name: 'Tea', price: 10 },
      { name: 'Bru Coffee', price: 20 },
      { name: 'KT', price: 20 },
      { name: 'Bournvita', price: 25 },
      { name: 'Horlicks', price: 25 },
      { name: 'Milk', price: 20 },
      { name: 'Black Tea', price: 15 },
      { name: 'Kashaya', price: 20 },
    ]
  },
  {
    title: 'South Indian',
    items: [
      { name: 'Upma', price: 27 },
      { name: 'Sheera', price: 35 },
      { name: 'Idli', sizes: [{ size: 'Single', price: 20 }, { size: 'Double', price: 35 }] },
      { name: 'Vada', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] },
      { name: 'Idli Vada', sizes: [{ size: 'Single', price: 50 }, { size: 'Double', price: 62 }] },
      { name: 'Puri', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] },
      { name: 'Kurma Puri', sizes: [{ size: 'Single', price: 37 }] },
      { name: 'Rice Palav', price: 30 },
      { name: 'Rava Idli', sizes: [{ size: 'Single', price: 25 }, { size: 'Double', price: 50 }] },
      { name: 'Bajji', sizes: [{ size: 'Single', price: 25 }, { size: 'Double', price: 40 }] },
      { name: 'Bonda Patato', sizes: [{ size: 'Single', price: 25 }, { size: 'Double', price: 50 }] },
    ]
  },
  {
    title: 'Dosa',
    items: [
      { name: 'Akki Dosa', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] },
      { name: 'Masala Dosa', price: 55 },
      { name: 'Masala Dosa (cut)', price: 55 },
      { name: 'Paper Masala Dosa', price: 65 },
      { name: 'Set Dosa', price: 60 },
      { name: 'Rava Dosa', price: 60 },
      { name: 'Palak Dosa', price: 70 },
      { name: 'Tomato Dosa', price: 55 },
      { name: 'Uttappa', price: 55 },
      { name: 'Uttappa Cut', price: 55 },
      { name: 'Bread Toase', price: 70 },
      { name: 'Mosaru Avalakki', price: 40 },
      { name: 'Mosaru Vada', sizes: [{ size: 'Single', price: 40 }, { size: 'Double', price: 65 }] },
    ]
  },
  {
    title: 'Khara and Sweets',
    items: [
      { name: 'Chakkali', price: 30 },
      { name: 'Shev Chooda', price: 35 },
      { name: 'Gulab Jamoon', sizes: [{ size: 'Single', price: 10 }, { size: 'Double', price: 20 }] },
      { name: 'Balusha', price: 20 },
      { name: 'Mysore Pak', price: 20 },
    ]
  },
  {
    title: 'Pav Bhaji',
    items: [
      { name: 'Pav Bhaji', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] },
      { name: 'Special Pav Bhaji', price: 70 },
      { name: 'Extra Pav', price: 10 },
    ]
  },
  {
    title: 'South Indian Meals & Rice',
    items: [
      { name: 'Meals', price: 90 },
      { name: 'Extra Rice', price: 25 },
      { name: 'Extra Chapati', price: 10 },
      { name: 'Chapati Bhaji', price: 30 },
      { name: 'Rice, Sambar', price: 30 },
      { name: 'Tandoori Roti Meals', price: 110 },
    ]
  },
  {
    title: 'Chats',
    items: [
      { name: 'Bhelpuri', price: 30 },
      { name: 'Shevpuri', price: 30 },
      { name: 'Panipuri', price: 30 },
      { name: 'Panipuri (Extra)', price: 30 },
      { name: 'Dahipuri', price: 30 },
    ]
  },
  {
    title: 'Salad / Raitha / Papad',
    items: [
      { name: 'Green Salad', price: 30 },
      { name: 'Mix Veg Raitha', price: 35 },
      { name: 'Boondi Raitha', price: 35 },
      { name: 'Cup Curd', price: 15 },
      { name: 'Masala Papad', price: 30 },
      { name: 'Papad Fry', price: 25 },
      { name: 'Papad Roasted', price: 25 },
    ]
  },
  {
    title: 'Soup',
    items: [
      { name: 'Sweet Corn Veg Soup', price: 70 },
      { name: 'Veg Manchows Soup', price: 70 },
      { name: 'Tomato Soup', price: 70 },
    ]
  },
  {
    title: 'Chinese',
    items: [
      { name: 'Gobi Manchurian', price: 65 },
      { name: 'Gobi Chilly', price: 75 },
      { name: 'Gobi 65', price: 75 },
      { name: 'Finger Chips', price: 65 },
      { name: 'Paneer Chilly', price: 130 },
      { name: 'Paneer Manchurian', price: 130 },
      { name: 'Paneer 65', price: 130 },
      { name: 'Mushroom Chilly', price: 130 },
      { name: 'Mushroom 65', price: 130 },
      { name: 'Mushroom Manchurian', price: 130 },
      { name: 'Veg Harabara Kabab', price: 160 },
    ]
  },
  {
    title: 'Frieds Rice & Noodles',
    items: [
      { name: 'Veg Fried Rice', price: 90 },
      { name: 'Veg Schezwan Rice', price: 100 },
      { name: 'Singapore Rice', price: 130 },
      { name: 'Paneer Fried Rice', price: 130 },
      { name: 'Kaju Fried Rice', price: 150 },
      { name: 'Veg Hakka Noodles', price: 100 },
      { name: 'Veg Schezwan Noodles', price: 130 },
      { name: 'Veg Singapore Noodles', price: 90 },
      { name: 'Mushroom Fried Rice', price: 130 },
    ]
  },
  {
    title: 'Dal',
    items: [
      { name: 'Dal Fry', price: 110 },
      { name: 'Dal Thadka', price: 120 },
      { name: 'Dal Kolhapuri', price: 120 },
    ]
  },
  {
    title: 'North Indian',
    items: [
      { name: 'Kaju Karry', price: 140 },
      { name: 'Kaju Kurma', price: 150 },
      { name: 'Kaju Masala', price: 150 },
      { name: 'Kaju Kolhapuri', price: 160 },
      { name: 'Kaju Panneer', price: 165 },
      { name: 'Veg Kolhapuri', price: 130 },
      { name: 'Veg Kadai/Handi', price: 145 },
      { name: 'Mix Veg/ Kurma', price: 130 },
      { name: 'Veg Hydtabadi', price: 130 },
      { name: 'Panneer Butter Masala', price: 150 },
      { name: 'Panneer Tikka Masala', price: 165 },
      { name: 'Panneer Makhanwala', price: 140 },
      { name: 'Panneer Handi/Kadai', price: 160 },
      { name: 'Panneer Muttar', price: 150 },
      { name: 'Panneer Kolhapuri', price: 140 },
      { name: 'Mushroom Masala', price: 145 },
      { name: 'Mushroom Kolhapuri', price: 130 },
      { name: 'Mushroom Kadai', price: 150 },
      { name: 'Alu Mushroom', price: 130 },
      { name: 'Malai Kofta', price: 160 },
      { name: 'Panneer Bhurji', price: 170 },
      { name: 'Panneer Kofta', price: 160 },
      { name: 'Veg Patiyala', price: 160 },
      { name: 'Plain Palak', price: 130 },
      { name: 'Aaloo Palak', price: 120 },
      { name: 'Aaloo Jeera Fry', price: 120 },
      { name: 'Green Peice Masala', price: 130 },
      { name: 'Green Peice Palak', price: 130 },
      { name: 'Channa Masala', price: 110 },
      { name: 'Veg, Bendi Masala', price: 130 },
      { name: 'Veg Baigon Masala', price: 130 },
      { name: 'Malasa Mangalya Special', price: 350 },
    ]
  },
  {
    title: 'Tandoori',
    items: [
      { name: 'Roti', price: 25 },
      { name: 'Butter Roti', price: 30 },
      { name: 'Parotta', price: 45 },
      { name: 'Butter Parotta', price: 50 },
      { name: 'Aaloo Parotta', price: 55 },
      { name: 'Kulcha', price: 30 },
      { name: 'Butter Kulcha', price: 35 },
      { name: 'Nan', price: 35 },
      { name: 'Butter Nan', price: 40 },
      { name: 'Chapati', price: 10 },
      { name: 'Butter Chapati', price: 15 },
    ]
  },
  {
    title: 'Rice & Biriyani',
    items: [
      { name: 'Veg Biriyani', price: 120 },
      { name: 'Panneer Biriyani', price: 130 },
      { name: 'Dal Kichadi', price: 110 },
      { name: 'Palak Kichadi', price: 110 },
      { name: 'Curd Rice', price: 90 },
      { name: 'Jeera Rice', price: 90 },
      { name: 'Ghee Rice', price: 100 },
    ]
  },
  {
    title: 'Juice & Milkshakes',
    items: [
      { name: 'Watermelon Milkshake', price: 50 },
      { name: 'Mosambi', price: 55 },
      { name: 'Orrange', price: 55 },
      { name: 'Apple', price: 60 },
      { name: 'Mango', price: 60 },
      { name: 'Chikku', price: 50 },
      { name: 'Pineapple', price: 50 },
      { name: 'Apple Milkshake', price: 55 },
      { name: 'Chikku Milkshake', price: 55 },
      { name: 'Mango Milkshake', price: 60 },
      { name: 'Strawberry Milkshake', price: 70 },
      { name: 'Rose Milkshake', price: 50 },
      { name: 'Pista Milkshake', price: 55 },
      { name: 'Coctail Milkshake', price: 55 },
      { name: 'Faluda', price: 70 },
      { name: 'Faluda Half', price: 50 },
      { name: 'Lassi', price: 35 },
      { name: 'Butter Milk', price: 25 },
    ]
  },
  {
    title: 'Soft Drinks',
    items: [
      { name: 'Soft Drinks (Assorted)', price: 'Seasonal' },
      { name: 'Mango Slice', price: 'Seasonal' },
      { name: 'Jeera Soda', price: 'Seasonal' },
      { name: 'Mineral Water', price: 'Seasonal' },
    ]
  },
];

const MalasaMangalyaMenu = () => {
  return (
    <div className={css.menuContainer}>
      <div className={css.header}><h1>Malasa Mangalya Menu</h1></div>
      {menuData.map((section) => (
        <div className={css.menuSection} key={section.title}>
          <CategoryHeader title={section.title} categoryKey={section.title} />
          <div className={css.menuGrid}>
            {section.items.map((item) => (
              <MenuCard
                key={item.name}
                item={item}
                restaurantName="Malasa Mangalya"
                categoryName={section.title}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MalasaMangalyaMenu;
