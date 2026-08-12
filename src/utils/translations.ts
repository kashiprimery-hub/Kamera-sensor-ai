import { ObjectCategory } from '../types';

export interface ObjectInfo {
  indonesian: string;
  category: ObjectCategory;
  emoji: string;
}

export const COCO_INDONESIAN_MAP: Record<string, ObjectInfo> = {
  // MANUSIA
  person: { indonesian: 'MANUSIA', category: 'MANUSIA', emoji: '🚶' },

  // HEWAN
  cat: { indonesian: 'KUCING', category: 'HEWAN', emoji: '🐈' },
  dog: { indonesian: 'ANJING', category: 'HEWAN', emoji: '🐕' },
  bird: { indonesian: 'BURUNG', category: 'HEWAN', emoji: '🐦' },
  horse: { indonesian: 'KUDA', category: 'HEWAN', emoji: '🐎' },
  sheep: { indonesian: 'DOMBA', category: 'HEWAN', emoji: '🐑' },
  cow: { indonesian: 'SAPI', category: 'HEWAN', emoji: '🐄' },
  elephant: { indonesian: 'GAJAH', category: 'HEWAN', emoji: '🐘' },
  bear: { indonesian: 'BERUANG', category: 'HEWAN', emoji: '🐻' },
  zebra: { indonesian: 'ZEBRA', category: 'HEWAN', emoji: '🦓' },
  giraffe: { indonesian: 'JERAPAH', category: 'HEWAN', emoji: '🦒' },

  // KENDARAAN
  car: { indonesian: 'MOBIL', category: 'KENDARAAN', emoji: '🚗' },
  motorcycle: { indonesian: 'MOTOR', category: 'KENDARAAN', emoji: '🛵' },
  bicycle: { indonesian: 'SEPEDA', category: 'KENDARAAN', emoji: '🚲' },
  bus: { indonesian: 'BUS', category: 'KENDARAAN', emoji: '🚌' },
  truck: { indonesian: 'TRUK', category: 'KENDARAAN', emoji: '🚚' },
  train: { indonesian: 'KERETA', category: 'KENDARAAN', emoji: '🚆' },
  airplane: { indonesian: 'PESAWAT', category: 'KENDARAAN', emoji: '✈️' },
  boat: { indonesian: 'PERAHU', category: 'KENDARAAN', emoji: '🚤' },

  // BENDA / PERALATAN / PERABOTAN
  chair: { indonesian: 'KURSI', category: 'BENDA', emoji: '🪑' },
  'dining table': { indonesian: 'MEJA', category: 'BENDA', emoji: '🪵' },
  couch: { indonesian: 'SOFA', category: 'BENDA', emoji: '🛋️' },
  'potted plant': { indonesian: 'TANAMAN', category: 'BENDA', emoji: '🪴' },
  bed: { indonesian: 'TEMPAT TIDUR', category: 'BENDA', emoji: '🛏️' },
  tv: { indonesian: 'TV', category: 'BENDA', emoji: '📺' },
  laptop: { indonesian: 'LAPTOP', category: 'BENDA', emoji: '💻' },
  'cell phone': { indonesian: 'HANDPHONE', category: 'BENDA', emoji: '📱' },
  bottle: { indonesian: 'BOTOL', category: 'BENDA', emoji: '🍾' },
  cup: { indonesian: 'CANGKIR', category: 'BENDA', emoji: '☕' },
  fork: { indonesian: 'GARPU', category: 'BENDA', emoji: '🍴' },
  knife: { indonesian: 'PISAU', category: 'BENDA', emoji: '🔪' },
  spoon: { indonesian: 'SENDOK', category: 'BENDA', emoji: '🥄' },
  bowl: { indonesian: 'MANGKUK', category: 'BENDA', emoji: '🥣' },
  backpack: { indonesian: 'TAS PUNGGUNG', category: 'BENDA', emoji: '🎒' },
  handbag: { indonesian: 'TAS TANGAN', category: 'BENDA', emoji: '👜' },
  suitcase: { indonesian: 'KOPER', category: 'BENDA', emoji: '🧳' },
  book: { indonesian: 'BUKU', category: 'BENDA', emoji: '📖' },
  clock: { indonesian: 'JAM', category: 'BENDA', emoji: '⏰' },
  vase: { indonesian: 'VAS', category: 'BENDA', emoji: '🏺' },
  scissors: { indonesian: 'GUNTING', category: 'BENDA', emoji: '✂️' },
  'teddy bear': { indonesian: 'BONEKA BERUANG', category: 'BENDA', emoji: '🧸' },
  toothbrush: { indonesian: 'SIKAT GIGI', category: 'BENDA', emoji: '🪥' },
  remote: { indonesian: 'REMOTE', category: 'BENDA', emoji: '🎮' },
  keyboard: { indonesian: 'KEYBOARD', category: 'BENDA', emoji: '⌨️' },
  mouse: { indonesian: 'MOUSE', category: 'BENDA', emoji: '🖱️' },
  microwave: { indonesian: 'MICROWAVE', category: 'BENDA', emoji: '🎛️' },
  oven: { indonesian: 'OVEN', category: 'BENDA', emoji: '🍳' },
  toaster: { indonesian: 'TOASTER', category: 'BENDA', emoji: '🍞' },
  sink: { indonesian: 'WASTAFEL', category: 'BENDA', emoji: '🚰' },
  refrigerator: { indonesian: 'KULKAS', category: 'BENDA', emoji: '🧊' },
  umbrella: { indonesian: 'PAYUNG', category: 'BENDA', emoji: '☂️' },
  'sports ball': { indonesian: 'BOLA', category: 'BENDA', emoji: '⚽' },
  skateboard: { indonesian: 'SKATEBOARD', category: 'BENDA', emoji: '🛹' },
  surfboard: { indonesian: 'PAPAN SELANCAR', category: 'BENDA', emoji: '🏄' },
  'tennis racket': { indonesian: 'RAKET TENNIS', category: 'BENDA', emoji: '🎾' },
  'wine glass': { indonesian: 'GELAS ANGGUR', category: 'BENDA', emoji: '🍷' }
};

export function translateClassName(rawClass: string): ObjectInfo {
  const normalized = rawClass.toLowerCase().trim();
  if (COCO_INDONESIAN_MAP[normalized]) {
    return COCO_INDONESIAN_MAP[normalized];
  }

  // Fallback translation cleanup
  const formatted = rawClass.toUpperCase();
  return {
    indonesian: formatted || 'OBJEK TIDAK DIKENALI',
    category: 'OBJEK_LAINNYA',
    emoji: '📦'
  };
}

export const CATEGORY_COLORS: Record<ObjectCategory, { stroke: string; fill: string; badge: string }> = {
  MANUSIA: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  HEWAN: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  KENDARAAN: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  BENDA: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  OBJEK_LAINNYA: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40' }
};
