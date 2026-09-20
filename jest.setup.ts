jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => true,
}));

jest.mock('@shopify/react-native-skia', () => {
  const ReactModule: typeof import('react') = jest.requireActual('react');
  const { View: NativeView } = jest.requireActual<typeof import('react-native')>(
    'react-native',
  );
  const Primitive = ({ children }: { children?: import('react').ReactNode }) =>
    ReactModule.createElement(NativeView, null, children);
  return {
    Canvas: Primitive,
    Circle: Primitive,
    Rect: Primitive,
    RoundedRect: Primitive,
  };
});

Object.defineProperty(require('react-native').AppState, 'currentState', {
  configurable: true,
  value: 'active',
});

const { act: reactAct } = jest.requireActual<typeof import('react')>('react');
const { notifyManager } = jest.requireActual<typeof import('@tanstack/react-query')>(
  '@tanstack/react-query',
);

notifyManager.setNotifyFunction((notify) => {
  const previous = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  reactAct(notify);
  globalThis.IS_REACT_ACT_ENVIRONMENT = previous;
});
