import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

const PerfilCard = ({ onAbrirPerfil }) => {
  const user = useAuthStore((state) => state.user);

  const username = useMemo(() => {
    return user?.username || user?.nombre_usuario || user?.nombre || '';
  }, [user]);

  const inicial = (username?.charAt(0) || '?').toUpperCase();
  const [imgOk, setImgOk] = useState(true);

  return (
    <button type="button" className="soberania-perfil-card" onClick={onAbrirPerfil}>
      <div className="soberania-perfil-row">
        <div className="soberania-perfil-avatar">
          {imgOk ? (
            <img
              src="/antiguas/fotoPerfil1.jpg"
              alt={`Perfil de ${username || 'Jugador'}`}
              onError={() => setImgOk(false)}
            />
          ) : (
            <span className="soberania-perfil-avatar__inicial">{inicial}</span>
          )}
        </div>
        <p className="soberania-perfil-nombre">{username || 'COMANDANTE'}</p>
      </div>
    </button>
  );
};

export default PerfilCard;

