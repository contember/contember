import { Model } from '@contember/schema'
import { EntityConstructor, Interface, RelationTarget } from '../types'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'

export class OneHasOneDefinitionImpl extends FieldDefinition<OneHasOneDefinitionOptions> {
	type = 'OneHasOneDefinition' as const

	inversedBy(inversedBy: string): Interface<OneHasOneDefinition> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningColumn(columnName: string): Interface<OneHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.joiningColumn, columnName })
	}

	onDelete(onDelete: Model.OnDelete): Interface<OneHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.joiningColumn, onDelete })
	}

	cascadeOnDelete(): Interface<OneHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.cascade })
	}

	setNullOnDelete(): Interface<OneHasOneDefinition> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.setNull })
	}

	notNull(): Interface<OneHasOneDefinition> {
		return this.withOption('nullable', false)
	}

	removeOrphan(): Interface<OneHasOneDefinition> {
		return this.withOption('orphanRemoval', true)
	}

	createField({ name, conventions, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		const joiningColumn: Partial<Model.JoiningColumn> = options.joiningColumn || {}

		return {
			name: name,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			nullable: options.nullable === undefined ? true : options.nullable,
			type: Model.RelationType.OneHasOne,
			target: entityRegistry.getName(options.target),
			joiningColumn: {
				columnName: joiningColumn.columnName || conventions.getJoiningColumnName(name),
				onDelete: joiningColumn.onDelete || Model.OnDelete.restrict,
			},
			...(options.orphanRemoval ? { orphanRemoval: true } : {}),
		}
	}
}

export type OneHasOneDefinition = Interface<OneHasOneDefinitionImpl>

export function oneHasOne(target: EntityConstructor, inversedBy?: string): OneHasOneDefinition {
	return new OneHasOneDefinitionImpl({ target, inversedBy })
}

export type OneHasOneDefinitionOptions = {
	target: RelationTarget
	inversedBy?: string
	joiningColumn?: Partial<Model.JoiningColumn>
	nullable?: boolean
	orphanRemoval?: true
}
