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
  'illustrated:furniture:lighting-firefly-stand': {
    key: 'illustrated:furniture:lighting-firefly-stand',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/lighting-firefly-stand.png'),
  },
  'illustrated:furniture:rug-soft-oval': {
    key: 'illustrated:furniture:rug-soft-oval',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/rug-soft-oval.png'),
  },
  'illustrated:furniture:curtain-sunlight-ribbon': {
    key: 'illustrated:furniture:curtain-sunlight-ribbon',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/curtain-sunlight-ribbon.png'),
  },
  'illustrated:furniture:curtain-cloud-valance': {
    key: 'illustrated:furniture:curtain-cloud-valance',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/curtain-cloud-valance.png'),
  },
  'illustrated:furniture:curtain-leaf-panels': {
    key: 'illustrated:furniture:curtain-leaf-panels',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/curtain-leaf-panels.png'),
  },
  'illustrated:furniture:table-cloud-low': {
    key: 'illustrated:furniture:table-cloud-low',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/table-cloud-low.png'),
  },
  'illustrated:furniture:cushion-star': {
    key: 'illustrated:furniture:cushion-star',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/cushion-star.png'),
  },
  'illustrated:furniture:rug-daisy': {
    key: 'illustrated:furniture:rug-daisy',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/rug-daisy.png'),
  },
  'illustrated:furniture:bed-cloud-nest': {
    key: 'illustrated:furniture:bed-cloud-nest',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/bed-cloud-nest.png'),
  },
  'illustrated:furniture:lighting-cloud-pendant': {
    key: 'illustrated:furniture:lighting-cloud-pendant',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/lighting-cloud-pendant.png'),
  },
  'illustrated:furniture:plant-cactus-trio': {
    key: 'illustrated:furniture:plant-cactus-trio',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/plant-cactus-trio.png'),
  },
  'illustrated:furniture:snack-acorn-cookie': {
    key: 'illustrated:furniture:snack-acorn-cookie',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/snack-acorn-cookie.png'),
  },
  'illustrated:furniture:table-tulip-pedestal': {
    key: 'illustrated:furniture:table-tulip-pedestal',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/table-tulip-pedestal.png'),
  },
  'illustrated:furniture:cushion-mint-knot': {
    key: 'illustrated:furniture:cushion-mint-knot',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/cushion-mint-knot.png'),
  },
  'illustrated:furniture:rug-wavy': {
    key: 'illustrated:furniture:rug-wavy',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/rug-wavy.png'),
  },
  'illustrated:furniture:bed-log': {
    key: 'illustrated:furniture:bed-log',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/bed-log.png'),
  },
  'illustrated:furniture:lighting-mushroom': {
    key: 'illustrated:furniture:lighting-mushroom',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/lighting-mushroom.png'),
  },
  'illustrated:furniture:plant-hanging-ivy': {
    key: 'illustrated:furniture:plant-hanging-ivy',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/plant-hanging-ivy.png'),
  },
  'illustrated:furniture:snack-carrot-stars': {
    key: 'illustrated:furniture:snack-carrot-stars',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/snack-carrot-stars.png'),
  },
  'illustrated:furniture:curtain-star-drape': {
    key: 'illustrated:furniture:curtain-star-drape',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/curtain-star-drape.png'),
  },
  'illustrated:furniture:table-shelf': {
    key: 'illustrated:furniture:table-shelf',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/table-shelf.png'),
  },
  'illustrated:furniture:cushion-cloud': {
    key: 'illustrated:furniture:cushion-cloud',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/cushion-cloud.png'),
  },
  'illustrated:furniture:rug-picnic-check': {
    key: 'illustrated:furniture:rug-picnic-check',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/rug-picnic-check.png'),
  },
  'illustrated:furniture:bed-berry-canopy': {
    key: 'illustrated:furniture:bed-berry-canopy',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/bed-berry-canopy.png'),
  },
  'illustrated:furniture:lighting-constellation': {
    key: 'illustrated:furniture:lighting-constellation',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/lighting-constellation.png'),
  },
  'illustrated:furniture:plant-flower-pot': {
    key: 'illustrated:furniture:plant-flower-pot',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/plant-flower-pot.png'),
  },
  'illustrated:furniture:snack-fish-cloud': {
    key: 'illustrated:furniture:snack-fish-cloud',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/snack-fish-cloud.png'),
  },
  'illustrated:furniture:curtain-cafe-check': {
    key: 'illustrated:furniture:curtain-cafe-check',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/curtain-cafe-check.png'),
  },
  'illustrated:furniture:table-clover': {
    key: 'illustrated:furniture:table-clover',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/table-clover.png'),
  },
  'illustrated:furniture:cushion-petal': {
    key: 'illustrated:furniture:cushion-petal',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/cushion-petal.png'),
  },
  'illustrated:furniture:rug-forest-path': {
    key: 'illustrated:furniture:rug-forest-path',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/rug-forest-path.png'),
  },
  'illustrated:furniture:bed-bookcase': {
    key: 'illustrated:furniture:bed-bookcase',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/bed-bookcase.png'),
  },
  'illustrated:furniture:lighting-tulip': {
    key: 'illustrated:furniture:lighting-tulip',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/lighting-tulip.png'),
  },
  'illustrated:furniture:plant-mini-palm': {
    key: 'illustrated:furniture:plant-mini-palm',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/plant-mini-palm.png'),
  },
  'illustrated:furniture:snack-milk-jelly': {
    key: 'illustrated:furniture:snack-milk-jelly',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/snack-milk-jelly.png'),
  },
  'illustrated:furniture:snack-leaf-biscuit': {
    key: 'illustrated:furniture:snack-leaf-biscuit',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/snack-leaf-biscuit.png'),
  },
  'illustrated:memory:ribbon-frame': {
    key: 'illustrated:memory:ribbon-frame',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-ribbon-frame.png'),
  },
  'illustrated:memory:picnic-table': {
    key: 'illustrated:memory:picnic-table',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-picnic-table.png'),
  },
  'illustrated:memory:night-radio': {
    key: 'illustrated:memory:night-radio',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-night-radio.png'),
  },
  'illustrated:memory:leaf-frame': {
    key: 'illustrated:memory:leaf-frame',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-leaf-frame.png'),
  },
  'illustrated:memory:birthday-table': {
    key: 'illustrated:memory:birthday-table',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-birthday-table.png'),
  },
  'illustrated:memory:picnic-radio': {
    key: 'illustrated:memory:picnic-radio',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-picnic-radio.png'),
  },
  'illustrated:memory:starlight-table': {
    key: 'illustrated:memory:starlight-table',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-starlight-table.png'),
  },
  'illustrated:memory:forest-radio': {
    key: 'illustrated:memory:forest-radio',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-forest-radio.png'),
  },
  'illustrated:memory:brunch-table': {
    key: 'illustrated:memory:brunch-table',
    kind: 'furniture',
    status: 'final',
    source: require('../../../../assets/illustrated/furniture/memory-brunch-table.png'),
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
