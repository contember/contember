import { Scalar } from '../treeParameters'

export class BoxedSingleEntityId {
	public constructor(public readonly id: string) {}
}

// HasMany relations are encoded as sets of entity ids.
// HasOne relations are encoded as BoxedSingleEntityId just to make them different from actual strings.
//		Not sure whether that is a reasonable precaution or just pure overhead.
export type SingleEntityPersistedData = Map<string, Scalar | BoxedSingleEntityId | Set<string>>

// The key is the entity id
export type PersistedEntityDataStore = Map<string, SingleEntityPersistedData>

// The key is the subTree placeholder name
export type SubTreeDataStore = Map<string, BoxedSingleEntityId | Set<string>>

export class NormalizedQueryResponseData {
	public constructor(
		public readonly subTreeDataStore: SubTreeDataStore,
		public readonly persistedEntityDataStore: PersistedEntityDataStore,
	) {}
}
