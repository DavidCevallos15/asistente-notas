import React from 'react';
import './CardButton.css';

const CardButton = ({ title, description, icon, onClick }) => {
  return (
    <div className="card-button" onClick={onClick} tabIndex={0} role="button">
      {icon && <div className="card-icon">{icon}</div>}
      <h2 className="card-title">{title}</h2>
      <p className="card-desc">{description}</p>
    </div>
  );
};

export default CardButton;
