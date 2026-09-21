import { mapAnimalRow, mapHouseRow, mapProfileRow } from '../mappers';

describe('Supabase row mappers', () => {
  it('maps generated profile, house, and animal rows into UI domain values', () => {
    expect(
      mapProfileRow({
        id: 'profile-1',
        display_name: '모모',
        point_color: '#FF99AA',
        created_at: '2026-09-21T00:00:00.000Z',
        updated_at: '2026-09-21T00:00:00.000Z',
      }),
    ).toEqual({ id: 'profile-1', displayName: '모모', pointColor: '#FF99AA' });
    expect(
      mapHouseRow({
        id: 'house-1',
        name: '모모네 집',
        status: 'active',
        admin_profile_id: 'profile-1',
        archived_at: null,
        created_at: '2026-09-21T00:00:00.000Z',
        updated_at: '2026-09-21T00:00:00.000Z',
      }),
    ).toEqual({ id: 'house-1', name: '모모네 집', capacity: 4 });
    expect(
      mapAnimalRow({
        id: 'animal-1',
        profile_id: 'profile-1',
        name: '콩이',
        species: 'rabbit',
        state: 'idle',
        created_at: '2026-09-21T00:00:00.000Z',
        updated_at: '2026-09-21T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'animal-1',
      ownerId: 'profile-1',
      name: '콩이',
      species: 'rabbit',
      state: 'idle',
    });
  });
});
