import { Model } from '@contember/schema'
import { Interface, RelationTarget } from './types'
import FieldDefinition from './FieldDefinition'

class ManyHasManyDefinition extends FieldDefinition<ManyHasManyDefinition.Options> {
	type = 'ManyHasManyDefinition' as const

	inversedBy(inversedBy: string): Interface<ManyHasManyDefinition> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningTable(joiningTable: Model.JoiningTable): Interface<ManyHasManyDefinition> {
		return this.withOption('joiningTable', joiningTable)
	}

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection = Model.OrderDirection.asc,
	): Interface<ManyHasManyDefinition> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}

	createField({ name, conventions, entityName, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const options = this.options
		let joiningTable: Model.JoiningTable | undefined = options.joiningTable
		if (!joiningTable) {
			const columnNames = conventions.getJoiningTableColumnNames(
				entityName,
				name,
				entityRegistry.getName(options.target),
				options.inversedBy,
			)
			joiningTable = {
				tableName: conventions.getJoiningTableName(entityName, name),
				joiningColumn: { columnName: columnNames[0], onDelete: Model.OnDelete.cascade },
				inverseJoiningColumn: { columnName: columnNames[1], onDelete: Model.OnDelete.cascade },
			}
		}

		return {
			type: Model.RelationType.ManyHasMany,
			name,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			target: entityRegistry.getName(options.target),
			joiningTable: joiningTable,
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
		}
	}
}

namespace ManyHasManyDefinition {
	export type Options = {
		target: RelationTarget
		inversedBy?: string
		joiningTable?: Model.JoiningTable
		orderBy?: Model.OrderBy[]
	}
}

export default ManyHasManyDefinition
