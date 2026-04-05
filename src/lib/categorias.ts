export type Categoria = {
  nombre: string;
  emoji: string;
  color: string;
  subcategorias: string[];
};

export const CATEGORIAS: Categoria[] = [
  {
    nombre: 'Comida',
    emoji: '🍔',
    color: '#f97316',
    subcategorias: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Delivery', 'Alcohol', 'Candy bar', 'Golosinas', 'Verdulería', 'Carnicería', 'Panadería', 'Frescos'],
  },
  {
    nombre: 'Auto',
    emoji: '🚗',
    color: '#3b82f6',
    subcategorias: ['Nafta', 'Estacionamiento', 'Mecánico', 'Peaje', 'Lavadero', 'Multa'],
  },
  {
    nombre: 'Casa',
    emoji: '🏠',
    color: '#8b5cf6',
    subcategorias: ['Crédito', 'Expensas', 'Servicio', 'Suscripción'],
  },
  {
    nombre: 'Salud',
    emoji: '💊',
    color: '#10b981',
    subcategorias: ['Médico', 'Dentista', 'OSDE', 'Peluquería'],
  },
  {
    nombre: 'Ocio',
    emoji: '🎉',
    color: '#ec4899',
    subcategorias: ['Cine', 'Teatro', 'Entradas', 'Deporte'],
  },
  {
    nombre: 'Regalo',
    emoji: '🎁',
    color: '#f59e0b',
    subcategorias: [],
  },
  {
    nombre: 'Rosita',
    emoji: '🐱',
    color: '#06b6d4',
    subcategorias: ['Alimento', 'Piedritas', 'Veterinario'],
  },
  {
    nombre: 'Producto',
    emoji: '🛍️',
    color: '#84cc16',
    subcategorias: ['Farmacia', 'Ropa', 'Librería', 'Mueble', 'Electrónica', 'Decoración', 'Accesorios', 'Limpieza'],
  },
];
