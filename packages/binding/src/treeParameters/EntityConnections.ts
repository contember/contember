import { SugaredUniqueWhere, UniqueWhere } from './primitives'

export type EntityConnections = Map<string, UniqueWhere> | undefined

// TODO allow deeper connections
export type SugaredEntityConnections =
	| {
			[hasOneRelationName: string]: SugaredUniqueWhere
	  }
	| Exclude<EntityConnections, undefined>
//| Array<[SugaredRelativeSingleEntity['field'], SugaredUniqueWhere]>
