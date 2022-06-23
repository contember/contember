import { EntityConstructor, Interface, RelationTarget } from '../types'
import { Model } from '@contember/schema'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'

export class ManyHasOneDefinitionImpl extends FieldDefinition<ManyHasOneDefinitionOptions> {
	type = 'ManyHasOneDefinition' as const

	inversedBy(inversedBy: string): Interface<ManyHasOneDefinition> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningColumn(columnName: string): Interface<ManyHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, columnName })
	}

	onDelete(onDelete: Model.OnDelete): Interface<ManyHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete })
	}

	cascadeOnDelete(): Interface<ManyHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.cascade })
	}

	setNullOnDelete(): Interface<ManyHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.setNull })
	}

	notNull(): Interface<ManyHasOneDefinition> {
		return this.withOption('nullable', false)
	}

	createField({ name, conventions, entityName, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		const joiningColumn = options.joiningColumn || {}
		return {
			name: name,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			nullable: options.nullable === undefined ? true : options.nullable,
			type: Model.RelationType.ManyHasOne,
			target: entityRegistry.getName(options.target),
			joiningColumn: {
				columnName: joiningColumn.columnName || conventions.getJoiningColumnName(name),
				onDelete: joiningColumn.onDelete || Model.OnDelete.restrict,
			},
		}
	}
}

export type ManyHasOneDefinition = Interface<ManyHasOneDefinitionImpl>

export function manyHasOne(target: EntityConstructor, inversedBy?: string): ManyHasOneDefinition {
	return new ManyHasOneDefinitionImpl({ target, inversedBy })
}

export type ManyHasOneDefinitionOptions = {
	target: RelationTarget
	inversedBy?: string
	joiningColumn?: Partial<Model.JoiningColumn>
	nullable?: boolean
}
