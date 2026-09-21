import type { Animal, House } from '@/domain/models';
import type { Database } from '@/types/database.generated';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type HouseRow = Database['public']['Tables']['houses']['Row'];
type AnimalRow = Database['public']['Tables']['animals']['Row'];

export type ProfileSummary = {
  id: string;
  displayName: string;
  pointColor: string;
};

export function mapProfileRow(row: ProfileRow): ProfileSummary {
  return {
    id: row.id,
    displayName: row.display_name,
    pointColor: row.point_color,
  };
}

export function mapHouseRow(row: HouseRow): House {
  return {
    id: row.id,
    name: row.name,
    capacity: 4,
  };
}

export function mapAnimalRow(row: AnimalRow): Animal {
  return {
    id: row.id,
    ownerId: row.profile_id,
    name: row.name,
    species: row.species,
    state: row.state,
  };
}
