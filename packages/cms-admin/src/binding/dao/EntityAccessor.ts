import { Accessor } from './Accessor'
import { EntityData } from './EntityData'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class EntityAccessor extends Accessor implements Errorable {
	public readonly primaryKey: string | EntityAccessor.UnpersistedEntityID

	public constructor(
		primaryKey: string | EntityAccessor.UnpersistedEntityID | undefined,
		public readonly typename: string | undefined,
		public readonly data: EntityData,
		public readonly errors: ErrorAccessor[],
		public readonly replaceWith: (replacement: EntityAccessor) => void,
		public readonly batchUpdates?: (performUpdates: (getAccessor: () => EntityAccessor) => void) => void,
		public readonly remove?: (removalType: EntityAccessor.RemovalType) => void
	) {
		super()
		this.primaryKey = primaryKey || new EntityAccessor.UnpersistedEntityID()
	}

	public isPersisted(): boolean {
		return typeof this.primaryKey === 'string'
	}

	public getKey() {
		return this.primaryKey instanceof EntityAccessor.UnpersistedEntityID ? this.primaryKey.value : this.primaryKey
	}

	public getPersistedKey() {
		return this.primaryKey instanceof EntityAccessor.UnpersistedEntityID ? undefined : this.primaryKey
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
