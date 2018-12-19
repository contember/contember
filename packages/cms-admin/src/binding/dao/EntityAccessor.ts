import { EntityData } from './EntityData'

class EntityAccessor {
	public readonly primaryKey: string | EntityAccessor.UnpersistedEntityID

	public constructor(
		primaryKey: string | EntityAccessor.UnpersistedEntityID | undefined,
		public readonly data: EntityData,
		public readonly replaceWith: (replacement: EntityAccessor) => void,
		public readonly remove?: (removalType: EntityAccessor.RemovalType) => void
	) {
		this.primaryKey = primaryKey || new EntityAccessor.UnpersistedEntityID()
	}

	public getKey() {
		return this.primaryKey instanceof EntityAccessor.UnpersistedEntityID ? this.primaryKey.value : this.primaryKey
	}
}

namespace EntityAccessor {
	export class UnpersistedEntityID {
		public readonly value: string

		private static generateId = (() => {
			let id = 0
			return () => id++
		})()

		public constructor() {
			this.value = `unpersistedEntity-${UnpersistedEntityID.generateId()}`
		}
	}

	export enum RemovalType {
		Disconnect = 'disconnect',
		Delete = 'delete'
	}
}

export { EntityAccessor }
