import { Scalar } from '../treeParameters'

export class BoxedHasOneRelationId {
	public constructor(public readonly id: string) {}
}

// hasMany relations are encoded as sets of entity ids
// hasOne relations are encoded as BoxedHasOneRelationId just to make them different from actual strings.
//		Not sure whether that is a reasonable precaution or just pure overhead.
export type SingleEntityPersistedData = Map<string, Scalar | BoxedHasOneRelationId | Set<string>>

// The key is the entity id
export type PersistedEntityDataStore = Map<string, SingleEntityPersistedData>
