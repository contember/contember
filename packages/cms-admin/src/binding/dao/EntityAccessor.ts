import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'

export default class EntityAccessor {

	constructor(
		public readonly primaryKey: string,
		public readonly data: { [name in FieldName]?: DataContextValue | DataContextValue[] },
		public readonly unlink: () => void,
	) {
	}
}
