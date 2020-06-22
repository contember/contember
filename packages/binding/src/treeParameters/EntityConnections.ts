import { SugaredUniqueWhere, UniqueWhere } from './primitives'

export type EntityConnections = UniqueWhere | undefined

// TODO think of a better name.
//		→ It can also be just e.g. 'column = value' in which case no actual connection in the sense of using `connect`
//			api directive would be used.
export type SugaredEntityConnections = SugaredUniqueWhere | SugaredUniqueWhere[] | Exclude<EntityConnections, undefined>
