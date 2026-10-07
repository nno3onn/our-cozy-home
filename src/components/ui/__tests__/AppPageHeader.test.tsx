import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';

import { AppPageHeader } from '../AppPageHeader';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => false, replace: mockReplace }),
}));

describe('AppPageHeader', () => {
  const dimensions = jest.spyOn(ReactNative, 'useWindowDimensions');

  afterEach(() => {
    dimensions.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
  });

  it('reserves a compact back target beside a wrapping title', async () => {
    dimensions.mockReturnValue({ fontScale: 1, height: 844, scale: 1, width: 320 });
    const view = await render(
      <AppPageHeader backHref="/" title="아주 긴 우리집 구성원 관리 제목" />,
    );

    expect(view.getByLabelText('이전 화면으로 돌아가기')).toBeOnTheScreen();
    expect(view.getByText('아주 긴 우리집 구성원 관리 제목').props.numberOfLines).toBeUndefined();
  });

  it('hides the mobile back target on wide pages by default', async () => {
    dimensions.mockReturnValue({ fontScale: 1, height: 800, scale: 1, width: 1280 });
    const view = await render(<AppPageHeader backHref="/" title="상점" />);

    expect(view.queryByLabelText('이전 화면으로 돌아가기')).not.toBeOnTheScreen();
  });
});
