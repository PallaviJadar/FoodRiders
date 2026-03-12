import {useState} from 'react'

import css from './RestUserReviewedCard.module.css'

import starImg from '/icons/star.png'
import shareImg from '/icons/share.png'
import likeImg from '/icons/like.png'
import likedImg from '/icons/liked.png'
import comment from '/icons/message.png'
import close from '/icons/close.png'

const RestUserReviewedCard = (props) => {
    let {userImg, reviewText, photos, categories, reactions, days, stars} = props?.data;
    let [alertBoxCss, setAlertBoxCss] = useState([css.alertBox, css.dnone].join(' '));
    let [liked, setLiked] = useState(false);
    let [toggleCommentBox, setToggleCommentBox] = useState(false);

    let shareURL = () => {
        navigator.clipboard.writeText(document.URL);
        setAlertBoxCss(css.alertBox);
        setTimeout(() => {
            setAlertBoxCss([css.alertBox, css.dnone].join(' '));
        }, 5000)
    }

    let closeAlert = () => {
        setAlertBoxCss([css.alertBox, css.dnone].join(' '));
    }

    return (
        <>
            <div className={alertBoxCss}>
                <span>Review link copied to clipboard</span> 
                <span onClick={closeAlert}>
                    <img src={close} alt='close button' className={css.closeImg} />
                </span>
            </div>
            <div className={css.outerDiv}>
                <div className={css.innerDiv}>
                    <div className={css.userInfo}>
                        <div className={css.userImgBox}>
                            <img src={userImg} className={css.userImg} alt="user profile" />
                        </div>
                        <div className={css.reviewContent}>
                            <div className={css.rating}>
                                {[...Array(5)].map((_, i) => (
                                    <img 
                                        key={i} 
                                        src={starImg} 
                                        className={i < stars ? css.starActive : css.star} 
                                        alt="star"
                                    />
                                ))}
                                <span className={css.days}>{days} days ago</span>
                            </div>
                            <div className={css.reviewText}>{reviewText}</div>
                            {photos.length > 0 && (
                                <div className={css.photoGallery}>
                                    {photos.map((photo, index) => (
                                        <img key={index} src={photo} alt={`Review photo ${index + 1}`} className={css.reviewPhoto} />
                                    ))}
                                </div>
                            )}
                            <div className={css.categories}>
                                {Object.entries(categories).map(([category, rating]) => (
                                    <div key={category} className={css.category}>
                                        <span className={css.categoryName}>{category}</span>
                                        <div className={css.categoryStars}>
                                            {[...Array(5)].map((_, i) => (
                                                <img 
                                                    key={i} 
                                                    src={starImg} 
                                                    className={i < rating ? css.starActive : css.star} 
                                                    alt="star"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={css.actions}>
                        <div className={css.actionButton} onClick={() => setLiked(val => !val)}>
                            <img src={liked ? likedImg : likeImg} alt='thumbs up' className={css.icon} />
                            <span>Helpful ({reactions.helpful})</span>
                        </div>
                        <div className={css.actionButton} onClick={() => setToggleCommentBox(val => !val)}>
                            <img src={comment} alt='comment' className={css.icon} />
                            <span>Comment ({reactions.helpful})</span>
                        </div>
                        <div className={css.actionButton} onClick={shareURL}>
                            <img src={shareImg} alt='share' className={css.icon} />
                            <span>Share</span>
                        </div>
                    </div>
                </div>
            </div>
            {toggleCommentBox && (
                <div className={css.commentBox}>
                    <div className={css.userImgBox}>
                        <img src={userImg} className={css.userImg} alt="user profile" />
                    </div>
                    <div className={css.inputBox}>
                        <input type='text' className={css.inptTxtBox} placeholder="Write your comment" />
                    </div>
                </div>
            )}
        </>
    );
}

export default RestUserReviewedCard
