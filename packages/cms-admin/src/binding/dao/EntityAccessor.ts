import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { EntityName, FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'

export type FieldData = DataContextValue | DataContextValue[]

export type EntityData = { [name in FieldName]: FieldData }

export default class EntityAccessor {
	constructor(
		public readonly entityName: EntityName,
		public readonly where: Input.Where<GraphQlBuilder.Literal> | Input.UniqueWhere<GraphQlBuilder.Literal>,
		public readonly primaryKey: string | undefined,
		public readonly data: EntityData,
		public readonly unlink?: () => void
	) {}

	withUpdatedField(field: FieldName, newData: FieldData): EntityAccessor {
		return new EntityAccessor(
			this.entityName,
			this.where,
			this.primaryKey,
			{ ...this.data, [field]: newData },
			this.unlink
		)
	}
}
