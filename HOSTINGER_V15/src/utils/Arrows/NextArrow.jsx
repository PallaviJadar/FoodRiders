import React from 'react'

import nextIcon from '/icons/next.png'

const NextArrow = (props) => {
  const { className, style, onClick } = props;

  return (
    <div
      className={className}
      style={{
        ...style,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "white",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        zIndex: 2,
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        right: "-20px"
      }}
      onClick={onClick}
    >
      <img src={nextIcon} alt="Next" style={{ width: "15px", height: "15px", objectFit: "contain" }} />
    </div>
  )
}

export default NextArrow
