import { Model } from '@contember/schema'
import { EntityConstructor, RelationTarget } from '../types'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'

export class ManyHasManyDefinition extends FieldDefinition<ManyHasManyDefinitionOptions> {
	type = 'ManyHasManyDefinition' as const

	public inversedBy(inversedBy: string): ManyHasManyDefinition {
		return this.withOption('inversedBy', inversedBy)
	}

	public joiningTable(joiningTable: Partial<Model.JoiningTable>): ManyHasManyDefinition {
		return this.withOption('joiningTable', joiningTable)
	}

	public orderBy(
		field: string | string[],
		direction: Model.OrderDirection | `${Model.OrderDirection}` = Model.OrderDirection.asc,
	): ManyHasManyDefinition {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction: direction as Model.OrderDirection }])
	}

	public deprecated(deprecationReason?: string): ManyHasManyDefinition {
		return this.withOption('deprecationReason', deprecationReason || 'This field is deprecated')
	}

	public description(description: string): ManyHasManyDefinition {
		return this.withOption('description', description)
	}

	public createField({ name, conventions, entityName, entityRegistry, strictDefinitionValidator }: CreateFieldContext): Model.AnyField {
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

		strictDefinitionValidator.validateInverseSide(entityName, name, options)

		return {
			type: Model.RelationType.ManyHasMany,
			name,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			target: entityRegistry.getName(options.target),
			joiningTable: joiningTable,
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
			...(options.description ? { description: options.description } : {}),
		}
	}


	protected withOption<K extends keyof ManyHasManyDefinitionOptions>(key: K, value: ManyHasManyDefinitionOptions[K]): ManyHasManyDefinition {
		return new ManyHasManyDefinition({ ...this.options, [key]: value })
	}
}


export function manyHasMany(target: EntityConstructor, inversedBy?: string): ManyHasManyDefinition {
	return new ManyHasManyDefinition({ target, inversedBy })
}

export type ManyHasManyDefinitionOptions = {
	target: RelationTarget
	inversedBy?: string
	joiningTable?: Partial<Model.JoiningTable>
	orderBy?: Model.OrderBy[]
	deprecationReason?: string
	description?: string
}
