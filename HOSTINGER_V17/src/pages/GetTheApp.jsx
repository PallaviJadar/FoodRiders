import css from './GetTheApp.module.css'

import Navbar2 from '../components/Navbars/NavigationBar.jsx'
import GetTheAppComp from '../components/HomeComponents/GetTheApp.jsx'
import DeveloperFooter from '../components/Footer/DeveloperFooter'

const GetTheApp = () => {
  return <div className={css.outerDiv}>
    <div className={css.innerDiv}>
      <Navbar2 />
      <GetTheAppComp />
      <DeveloperFooter />
    </div>
  </div>
}

export default GetTheApp
