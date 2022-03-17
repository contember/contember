import type { RelationFilter } from './RelationFilter'

export interface TreeFilter {
	entity: string
	id: string | number
	relations: RelationFilter[]
}
