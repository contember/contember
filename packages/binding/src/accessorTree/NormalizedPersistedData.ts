import type { EntityId, FieldValue, PlaceholderName } from '../treeParameters'
import type { ServerId, UniqueEntityId } from './RuntimeId'

// HasMany relations are encoded as sets of entity ids.
// HasOne relations are encoded as BoxedSingleEntityId just to make them different from actual strings.
//		Not sure whether that is a reasonable precaution or just pure overhead.
export type EntityFieldPersistedData = FieldValue | ServerId | EntityListPersistedData

export type SingleEntityPersistedData = Map<PlaceholderName, EntityFieldPersistedData>

export type EntityListPersistedData = Set<EntityId>

export type PersistedEntityDataStore = Map<UniqueEntityId, SingleEntityPersistedData>

// The key is the subTree placeholder name
export type SubTreeDataStore = Map<PlaceholderName, ServerId | EntityListPersistedData>

export class NormalizedPersistedData {
	public constructor(
		public readonly subTreeDataStore: SubTreeDataStore,
		public readonly persistedEntityDataStore: PersistedEntityDataStore,
	) {}
}
