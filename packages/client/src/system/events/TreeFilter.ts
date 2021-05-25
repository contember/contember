import type { RelationFilter } from './RelationFilter'

export interface TreeFilter {
	entity: string
	id: string
	relations: RelationFilter[]
}
