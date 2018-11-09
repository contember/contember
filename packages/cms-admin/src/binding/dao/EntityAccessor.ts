import { EntityData } from './EntityData'

class EntityAccessor {
	public readonly primaryKey: string | EntityAccessor.UnpersistedEntityID

	public constructor(
		primaryKey: string | EntityAccessor.UnpersistedEntityID | undefined,
		public readonly data: EntityData,
		public readonly replaceWith: (replacement: EntityAccessor) => void,
		public readonly unlink?: () => void
	) {
		this.primaryKey = primaryKey || new EntityAccessor.UnpersistedEntityID()
	}
}

namespace EntityAccessor {
	export class UnpersistedEntityID {
		public readonly value: string

		private generateId = (() => {
			let id = 0
			return () => id++
		})()

		public constructor() {
			this.value = `unpersistedEntity-${this.generateId()}`
		}
	}
}

export { EntityAccessor }
