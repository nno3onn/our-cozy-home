import { render } from '@testing-library/react-native';

import { InlineNotice } from '../InlineNotice';

describe('InlineNotice', () => {
  it('announces warning meaning through text rather than color alone', async () => {
    const view = await render(
      <InlineNotice message="연결 후 다시 시도해 주세요." title="오프라인" tone="warning" />,
    );

    expect(view.getByRole('alert')).toHaveProp(
      'accessibilityLabel',
      '주의. 오프라인. 연결 후 다시 시도해 주세요.',
    );
  });
});
