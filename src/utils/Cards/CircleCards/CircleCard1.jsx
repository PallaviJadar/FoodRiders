import css from './CircleCard1.module.css'

import { motion } from 'framer-motion';


let CircleCard1 = ({ imgSrc, name, onClick }) => {
    return (
        <div className={css.outerDiv} onClick={onClick}>
            <motion.div
                className={css.innerDiv}
                whileHover={{
                    scale: 1.1,
                    y: -10,
                    boxShadow: "0 20px 30px rgba(0,0,0,0.15)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                <div className={css.imgDiv}>
                    <motion.img
                        className={css.img}
                        src={imgSrc}
                        alt="food image"
                        whileHover={{ rotate: 10 }}
                    />
                </div>
                <div className={css.title}>{name}</div>
            </motion.div>
        </div>
    );
}

export default CircleCard1;
