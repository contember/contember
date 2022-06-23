import { Model } from '@contember/schema'
import { EntityConstructor, Interface, RelationTarget } from '../types.js'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition.js'

export class ManyHasManyDefinitionImpl extends FieldDefinition<ManyHasManyDefinitionOptions> {
	type = 'ManyHasManyDefinition' as const

	inversedBy(inversedBy: string): Interface<ManyHasManyDefinition> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningTable(joiningTable: Partial<Model.JoiningTable>): Interface<ManyHasManyDefinition> {
		return this.withOption('joiningTable', joiningTable)
	}

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection = Model.OrderDirection.asc,
	): Interface<ManyHasManyDefinition> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}

	createField({ name, conventions, entityName, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		const columnNames = conventions.getJoiningTableColumnNames(
			entityName,
			name,
			entityRegistry.getName(options.target),
			options.inversedBy,
		)
		const joiningTable = {
			tableName: conventions.getJoiningTableName(entityName, name),
			joiningColumn: { columnName: columnNames[0], onDelete: Model.OnDelete.cascade },
			inverseJoiningColumn: { columnName: columnNames[1], onDelete: Model.OnDelete.cascade },
			eventLog: { enabled: true },
			...options.joiningTable,
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

export type ManyHasManyDefinition = Interface<ManyHasManyDefinitionImpl>

export function manyHasMany(target: EntityConstructor, inversedBy?: string): ManyHasManyDefinition {
	return new ManyHasManyDefinitionImpl({ target, inversedBy })
}

export type ManyHasManyDefinitionOptions = {
	target: RelationTarget
	inversedBy?: string
	joiningTable?: Partial<Model.JoiningTable>
	orderBy?: Model.OrderBy[]
}
