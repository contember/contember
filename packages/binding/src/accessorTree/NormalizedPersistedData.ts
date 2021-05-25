import type { EntityId, PlaceholderName, Scalar } from '../treeParameters'
import type { ServerGeneratedUuid } from './RuntimeId'

// HasMany relations are encoded as sets of entity ids.
// HasOne relations are encoded as BoxedSingleEntityId just to make them different from actual strings.
//		Not sure whether that is a reasonable precaution or just pure overhead.
export type EntityFieldPersistedData = Scalar | ServerGeneratedUuid | EntityListPersistedData

export type SingleEntityPersistedData = Map<PlaceholderName, EntityFieldPersistedData>

export type EntityListPersistedData = Set<EntityId>

export type PersistedEntityDataStore = Map<EntityId, SingleEntityPersistedData>

// The key is the subTree placeholder name
export type SubTreeDataStore = Map<PlaceholderName, ServerGeneratedUuid | EntityListPersistedData>

export class NormalizedPersistedData {
	public constructor(
		public readonly subTreeDataStore: SubTreeDataStore,
		public readonly persistedEntityDataStore: PersistedEntityDataStore,
	) {}
}
