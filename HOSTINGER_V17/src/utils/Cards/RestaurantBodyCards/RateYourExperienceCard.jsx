import { useState } from "react";
import css from "./RateYourExperienceCard.module.css";

const RateYourExperienceCard = () => {
  return (
    <div className={css.outerDiv}>
      <div className={css.innerDiv}>
        <div className={css.ttl}>Share Your Experience</div>
        <div className={css.subTtl}>We'd love to hear from you!</div>

        <div className={css.ratingBox}>
          {/* Static 5 stars to match screenshot */}
          <span className={css.star}>★</span>
          <span className={css.star}>★</span>
          <span className={css.star}>★</span>
          <span className={css.star}>★</span>
          <span className={css.star}>★</span>
        </div>

        <a
          href="https://www.google.com/search?sca_esv=a6656f2fff5d25f6&hl=en-IN&sxsrf=AE3TifNOHont_Cs3K7OdeNIU42HqjP-CWw:1766217929371&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E82QlUQxJkZCfsqwtcjghTG48yFwDxdE1pno3i_D67NCHzzaAv6hA1ctVxhxbKtqy7u98JVA4Zl04CmJWmHKW0FpQguv&q=FOOD+RIDER%27S+Reviews&sa=X&ved=2ahUKEwjMsprC2suRAxWOT2wGHbljLd4Q0bkNegQIJBAE&biw=633&bih=725&dpr=1.5"
          target="_blank"
          rel="noopener noreferrer"
          className={css.modalTxt}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          Write a Review
        </a>
      </div>
    </div>
  );
};

export default RateYourExperienceCard;
