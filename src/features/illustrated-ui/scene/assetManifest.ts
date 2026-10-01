import type { ImageSourcePropType } from 'react-native';

export type IllustratedAsset = {
  key: string;
  kind: 'room' | 'animal' | 'furniture' | 'placeholder';
  status: 'final' | 'placeholder';
  source?: ImageSourcePropType;
};

const assets: Record<string, IllustratedAsset> = {
  'illustrated:room:sunny': {
    key: 'illustrated:room:sunny',
    kind: 'room',
    status: 'final',
    source: require('../../../../assets/illustrated/rooms/sunny-room.png'),
  },
  'illustrated:animal:rabbit': {
    key: 'illustrated:animal:rabbit',
    kind: 'animal',
    status: 'final',
    source: require('../../../../assets/illustrated/animals/rabbit.png'),
  },
  'illustrated:animal:cat': {
    key: 'illustrated:animal:cat',
    kind: 'animal',
    status: 'final',
    source: require('../../../../assets/illustrated/animals/cat.png'),
  },
  'illustrated:animal:bear': {
    key: 'illustrated:animal:bear',
    kind: 'animal',
    status: 'final',
    source: require('../../../../assets/illustrated/animals/bear.png'),
  },
  'illustrated:animal:dog': {
    key: 'illustrated:animal:dog',
    kind: 'animal',
    status: 'final',
    source: require('../../../../assets/illustrated/animals/dog.png'),
  },
  'illustrated:furniture:cushion-shell': {
    key: 'illustrated:furniture:cushion-shell',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/cushion-shell.png'),
  },
  'illustrated:furniture:table-cookie': {
    key: 'illustrated:furniture:table-cookie',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/table-cookie.png'),
  },
  'illustrated:furniture:plant-rubber-tree': {
    key: 'illustrated:furniture:plant-rubber-tree',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/plant-rubber-tree.png'),
  },
  'illustrated:furniture:bed-moon-sleep': {
    key: 'illustrated:furniture:bed-moon-sleep',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/bed-moon-sleep.png'),
  },
  'illustrated:memory:birthday-table': {
    key: 'illustrated:memory:birthday-table',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-birthday-table.png'),
  },
  'illustrated:placeholder:item': {
    key: 'illustrated:placeholder:item',
    kind: 'placeholder',
    status: 'placeholder',
  },
  'illustrated:placeholder:animal': {
    key: 'illustrated:placeholder:animal',
    kind: 'placeholder',
    status: 'placeholder',
  },
};

export function getIllustratedAsset(key: string): IllustratedAsset | undefined {
  return assets[key];
}
