// src/mock/menuMockData.ts
// MOCKUP: Datos inventados para la pantalla inicial del menú (Soberanía).

export type FriendEstado = 'ONLINE' | 'JUGANDO' | 'EN_LOBBY' | 'OFFLINE';

export type MockTopJugador = {
  id: string;
  username: string;
  victorias: number;
  isMock: true;
};

export type MockAmigoActivo = {
  id: string;
  username: string;
  estado: FriendEstado;
  isMock: true;
};

// Si en el futuro queréis insertar "Tú" dentro del Top 10,
// podéis ajustar esta posición y el widget lo renderiza según la regla.
export const mockMiPosicion = 67; // MOCKUP
export const mockVictoriasMi = 231; // MOCKUP

export const mockTopJugadores: MockTopJugador[] = [
  { id: 'top-1', username: 'DRAGONFIRE', victorias: 1280, isMock: true },
  { id: 'top-2', username: 'NACHTREICH', victorias: 1215, isMock: true },
  { id: 'top-3', username: 'SABLEAZUL', victorias: 1168, isMock: true },
  { id: 'top-4', username: 'CAPITANBRONCE', victorias: 1122, isMock: true },
  { id: 'top-5', username: 'VORTEX191', victorias: 1089, isMock: true },
  { id: 'top-6', username: 'RECLUTA_NORTE', victorias: 1044, isMock: true },
  { id: 'top-7', username: 'HIERROFIEL', victorias: 1008, isMock: true },
  { id: 'top-8', username: 'NEBULA89', victorias: 965, isMock: true },
  { id: 'top-9', username: 'MEDUSA_RAZOR', victorias: 931, isMock: true },
  { id: 'top-10', username: 'CIRCUITO', victorias: 900, isMock: true },
];

export const mockAmigosActivos: MockAmigoActivo[] = [
  { id: 'friend-1', username: 'LANCER_7', estado: 'ONLINE', isMock: true },
  { id: 'friend-2', username: 'ARTESANO', estado: 'JUGANDO', isMock: true },
  { id: 'friend-3', username: 'VIA_LENTA', estado: 'EN_LOBBY', isMock: true },
  { id: 'friend-4', username: 'FALCON_RM', estado: 'ONLINE', isMock: true },
  { id: 'friend-5', username: 'BRIGADA_S', estado: 'JUGANDO', isMock: true },
  { id: 'friend-6', username: 'CUARTELES', estado: 'EN_LOBBY', isMock: true },
  // Se puede añadir más si queréis que el widget tenga más scroll.
];

