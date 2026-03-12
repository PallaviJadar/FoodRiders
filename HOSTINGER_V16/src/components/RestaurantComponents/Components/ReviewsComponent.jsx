import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import css from './ReviewsComponent.module.css'

import RateYourExperienceCard from '../../../utils/Cards/RestaurantBodyCards/RateYourExperienceCard.jsx'
import RestUserReviewedCard from '../../../utils/RestaurantUtils/RestUserReviewedCard.jsx'
import DropdownUtil from '../../../utils/RestaurantUtils/DropdownUtil.jsx'

import profilepic from '/images/profilepic.jpg'
import dropdownIcon from '/icons/down-arrow1.png'
import menu from '/icons/menu.png'
import starIcon from '/icons/star.png'
import cameraIcon from '/icons/photo-camera.png'

const ReviewsComponent = () => {
  const { city, hotel } = useParams();
  const [selectedFilter, setSelectedFilter] = useState('All Reviews');
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const reviewSummary = {
    overallRating: 4.2,
    totalReviews: 156,
    ratingBreakdown: {
      5: 80,
      4: 45,
      3: 20,
      2: 8,
      1: 3
    },
    categories: {
      food: 4.5,
      service: 4.2,
      ambiance: 4.0,
      value: 4.3
    }
  };

  let data = [
    {
      imgSrc: profilepic,
      title: "Paradise Biryani",
      address: "Kukatpally, Hyd",
      reviews: 0,
      followers: 0,
      stars: 3,
      days: 10,
      votes: 10,
      comments: 2,
      id: 123,
      userImg: profilepic,
      userId: 11,
      reviewText: "Great food and amazing service! The biryani was perfectly cooked and the staff was very attentive.",
      photos: [profilepic],
      categories: {
        food: 5,
        service: 4,
        ambiance: 3,
        value: 4
      },
      reactions: {
        helpful: 10,
        funny: 2,
        love: 5
      }
    },
    {
      imgSrc: profilepic,
      title: "Paradise Biryani",
      address: "Kukatpally, Hyd",
      reviews: 0,
      followers: 0,
      stars: 3,
      days: 10,
      votes: 10,
      comments: 2,
      id: 123,
      userImg: profilepic,
      userId: 11,
      reviewText: "The ambiance was great but the food could be better. Service was prompt though.",
      photos: [],
      categories: {
        food: 3,
        service: 4,
        ambiance: 5,
        value: 3
      },
      reactions: {
        helpful: 5,
        funny: 1,
        love: 2
      }
    }
  ];

  const options1 = [
    "All Reviews",
    "Following",
    "Popular",
    "Bloggers",
    "My Reviews",
    "Order Reviews"
  ]

  const options2 = [
    "Newest First",
    "Oldest First",
    "Highest Rated",
    "Lowest Rated"
  ]

  const renderRatingBar = (rating, count, total) => {
    const percentage = (count / total) * 100;
    return (
      <div className={css.ratingBarContainer}>
        <span className={css.ratingLabel}>{rating} ★</span>
        <div className={css.ratingBar}>
          <div className={css.ratingFill} style={{ width: `${percentage}%` }}></div>
        </div>
        <span className={css.ratingCount}>{count}</span>
      </div>
    );
  };

  return (
    <div className={css.outerDiv}>
      <div className={css.innerDiv}>
        <div className={css.left}>
          {/* Review Summary Section */}
          <div className={css.reviewSummary}>
            <div className={css.summaryHeader}>
              <div className={css.overallRating}>
                <h2>{reviewSummary.overallRating}</h2>
                <div className={css.stars}>
                  {[...Array(5)].map((_, i) => (
                    <img 
                      key={i} 
                      src={starIcon} 
                      className={i < Math.floor(reviewSummary.overallRating) ? css.starActive : css.star} 
                      alt="star"
                    />
                  ))}
                </div>
                <p>{reviewSummary.totalReviews} reviews</p>
              </div>
              <div className={css.categoryRatings}>
                {Object.entries(reviewSummary.categories).map(([category, rating]) => (
                  <div key={category} className={css.categoryRating}>
                    <span className={css.categoryName}>{category}</span>
                    <div className={css.categoryStars}>
                      {[...Array(5)].map((_, i) => (
                        <img 
                          key={i} 
                          src={starIcon} 
                          className={i < Math.floor(rating) ? css.starActive : css.star} 
                          alt="star"
                        />
                      ))}
                    </div>
                    <span className={css.categoryValue}>{rating}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={css.ratingBreakdown}>
              {Object.entries(reviewSummary.ratingBreakdown).reverse().map(([rating, count]) => 
                renderRatingBar(rating, count, reviewSummary.totalReviews)
              )}
            </div>
          </div>

          {/* Filter and Sort Section */}
          <div className={css.dropDowns}>
            <DropdownUtil 
              options={options1} 
              icon2={dropdownIcon} 
              filFunc={(val) => setSelectedFilter(val)} 
            />
            <DropdownUtil 
              options={options2} 
              icon1={menu} 
              icon2={dropdownIcon}  
              filFunc={(val) => setSelectedSort(val)} 
            />
          </div>

          {/* Reviews List */}
          <div className={css.reviewsList}>
            {data?.map((item, id) => (
              <RestUserReviewedCard key={id} data={item} />
            ))}
          </div>
        </div>

        {/* Review Form Section */}
        <div className={css.right}>
          <RateYourExperienceCard />
          <div className={css.photoUpload}>
            <button className={css.uploadButton}>
              <img src={cameraIcon} alt="camera" />
              Add Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewsComponent
