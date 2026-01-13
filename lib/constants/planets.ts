import type { Position3D } from '@/types'

export interface PlanetConfig {
  name: string
  name_tr: string
  color: string
  description_tr: string
  position: Position3D
  scale: number
}

export const PLANETS: PlanetConfig[] = [
  {
    name: 'Happiness',
    name_tr: 'Mutluluk',
    color: '#FFD700',
    description_tr: 'Mutluluk ve sevinç anlarınızı paylaşın',
    position: [8, 2, 0],
    scale: 1.2,
  },
  {
    name: 'Love',
    name_tr: 'Aşk',
    color: '#FF69B4',
    description_tr: 'Aşk ve sevgi duygularınızı paylaşın',
    position: [6, 4, 5],
    scale: 1.3,
  },
  {
    name: 'Hope',
    name_tr: 'Umut',
    color: '#20D9D2',
    description_tr: 'Umut ve beklentilerinizi paylaşın',
    position: [-2, 5, 2],
    scale: 1.0,
  },
  {
    name: 'Longing',
    name_tr: 'Özlem',
    color: '#A855F7',
    description_tr: 'Özlem ve hasret duygularınızı paylaşın',
    position: [0, -2, 8],
    scale: 0.95,
  },
  {
    name: 'Sadness',
    name_tr: 'Hüzün',
    color: '#4A5FDD',
    description_tr: 'Üzüntü ve kederli anlarınızı paylaşın',
    position: [-5, -3, 4],
    scale: 1.0,
  },
  {
    name: 'Anger',
    name_tr: 'Öfke',
    color: '#FF4444',
    description_tr: 'Öfke ve kızgınlık duygularınızı paylaşın',
    position: [3, -4, -6],
    scale: 1.1,
  },
  {
    name: 'Depression',
    name_tr: 'Depresyon',
    color: '#64748B',
    description_tr: 'Depresyon ve ağır ruh hallerinizi paylaşın',
    position: [-6, -5, -2],
    scale: 1.0,
  },
  {
    name: 'Fear',
    name_tr: 'Korku',
    color: '#9333EA',
    description_tr: 'Korku ve endişelerinizi paylaşın',
    position: [-8, 1, -3],
    scale: 0.9,
  },
  {
    name: 'Regret',
    name_tr: 'Pişmanlık',
    color: '#8B4513',
    description_tr: 'Pişmanlık ve vicdan duygularınızı paylaşın',
    position: [5, -3, 6],
    scale: 1.0,
  },
  {
    name: 'Peace',
    name_tr: 'Huzur',
    color: '#86EFAC',
    description_tr: 'Huzur ve sükunet anlarınızı paylaşın',
    position: [4, 3, -4],
    scale: 1.1,
  },
]
