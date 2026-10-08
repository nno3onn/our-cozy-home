import { fireEvent, render } from '@testing-library/react-native';

import type { Animal, Member } from '@/domain/models';

import { AnimalDetailSheet } from '../AnimalDetailSheet';

const animal: Animal = { id: 'animal-a', ownerId: 'user-a', name: '말랑이', species: 'rabbit', state: 'playing' };
const owner: Member = { id: 'member-a', userId: 'user-a', displayName: '다은', pointColor: '#F18191', role: 'admin' };

describe('AnimalDetailSheet', () => {
  it('presents the selected animal and sends actions through its callback', async () => {
    const onAction = jest.fn();
    const view = await render(<AnimalDetailSheet animal={animal} disabled={false} onAction={onAction} onDismiss={jest.fn()} owner={owner} />);

    expect(view.getByRole('header', { name: '말랑이' })).toBeOnTheScreen();
    expect(view.getByText('다은이의 동물')).toBeOnTheScreen();
    expect(view.getByText('놀고 있어요')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: '놀아주기' }).props.accessibilityState).toEqual({ disabled: false, selected: true });
    expect(view.getByRole('button', { name: '간식 주기' }).props.accessibilityState).toEqual({ disabled: false, selected: false });
    fireEvent.press(view.getByRole('button', { name: '놀아주기' }));

    expect(onAction).toHaveBeenCalledWith('playing');
  });

  it('announces a server action failure without hiding the animal detail', async () => {
    const view = await render(
      <AnimalDetailSheet
        animal={animal}
        disabled={false}
        errorMessage="행동을 저장하지 못했어요. 다시 시도해 주세요."
        onAction={jest.fn()}
        onDismiss={jest.fn()}
        owner={owner}
      />,
    );

    expect(view.getByText('말랑이')).toBeOnTheScreen();
    expect(view.getByText('행동을 저장하지 못했어요. 다시 시도해 주세요.')).toBeOnTheScreen();
    expect(view.getByRole('alert')).toBeOnTheScreen();
  });

  it('keeps action controls disabled when a server-confirmed action is unavailable', async () => {
    const view = await render(<AnimalDetailSheet animal={animal} disabled onAction={jest.fn()} onDismiss={jest.fn()} owner={owner} />);

    expect(view.getByRole('button', { name: '간식 주기' })).toBeDisabled();
    expect(view.getByRole('button', { name: '놀아주기' })).toBeDisabled();
    expect(view.getByRole('button', { name: '쉬게 하기' })).toBeDisabled();
  });
});
