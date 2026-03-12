import BackButton from '../utils/RestaurantUtils/BackButton.jsx';
import css from './ErrorPage.module.css'

const ErrorPage = () => {
  return (
    <div className={css.outerDiv}>
      <BackButton className={css.errorBackBtn} />
      <div className={css.innerDiv}>
        <div className={css.errorTitle}>404</div>
        <div className={css.errorMessage}>Page Not Found</div>
        <div className={css.errorDesc}>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</div>
        <button className={css.homeBtn} onClick={() => window.location.href = '/'}>Go Home</button>
      </div>
    </div>
  )
}

export default ErrorPage
