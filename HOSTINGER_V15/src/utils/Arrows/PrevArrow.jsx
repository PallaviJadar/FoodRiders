import React from 'react'

import prevIcon from '/icons/prev.png'

const PrevArrow = (props) => {
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
        left: "-20px"
      }}
      onClick={onClick}
    >
      <img src={prevIcon} alt="Previous" style={{ width: "15px", height: "15px", objectFit: "contain" }} />
    </div>
  )
}

export default PrevArrow
