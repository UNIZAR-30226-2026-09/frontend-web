import React from 'react';

const JugarCard = ({ onAbrirOperaciones }) => {
  return (
    <button type="button" className="soberania-jugar-card" onClick={onAbrirOperaciones}>
      <div className="soberania-jugar-titulo">Jugar</div>
      <div className="soberania-jugar-sub">Accede al despliegue de operaciones</div>
    </button>
  );
};

export default JugarCard;

