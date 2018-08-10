import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'

export type EntityData = { [name in FieldName]: DataContextValue | DataContextValue[] }

export default class EntityAccessor {
	constructor(
		public readonly primaryKey: string | undefined,
		public readonly data: EntityData,
		public readonly unlink?: () => void
	) {}
}
