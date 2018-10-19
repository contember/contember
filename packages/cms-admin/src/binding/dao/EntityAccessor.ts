import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'
import EntityCollectionAccessor from './EntityCollectionAccessor'

export type FieldData = DataContextValue | EntityCollectionAccessor

export type EntityData = { [name in FieldName]: FieldData }

export default class EntityAccessor {
	constructor(
		public readonly primaryKey: string | undefined,
		public readonly data: EntityData,
		public readonly replaceWith: (replacement: EntityAccessor) => void,
		public readonly unlink?: () => void
	) {}
}
