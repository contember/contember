import EntityAccessor, { EntityData } from './EntityAccessor'

export default class EntityForRemovalAccessor {
	constructor(
		public readonly primaryKey: string,
		public readonly entityName: string,
		public readonly data: EntityData,
		public readonly replaceWith: (replacement: EntityAccessor) => void,
	) {}
}
