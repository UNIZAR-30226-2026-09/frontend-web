import React from 'react';
import PerfilCard from './PerfilCard';
import JugarCard from './JugarCard';
import TopGlobalWidget from './TopGlobalWidget';
import AmigosActivosWidget from './AmigosActivosWidget';
import '../../styles/MenuSoberaniaInicial.css';

const MenuInicialSoberania = ({ onAbrirPerfil, onAbrirOperaciones, onAbrirAmigos }) => {
  return (
    <div className="soberania-inicial">
      <div className="soberania-inicial__grid">
        <div className="soberania-inicial__topglobal">
          <TopGlobalWidget />
        </div>

        <div className="soberania-inicial__center">
        </div>

        <div className="soberania-inicial__friends">
          <AmigosActivosWidget onAbrirAmigos={onAbrirAmigos} />
        </div>
      </div>
      <PerfilCard onAbrirPerfil={onAbrirPerfil} />
      <JugarCard onAbrirOperaciones={onAbrirOperaciones} />
    </div>
  );
};

export default MenuInicialSoberania;

