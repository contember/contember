import { Model } from '@contember/schema'
import { Interface } from './types'
import FieldDefinition from './FieldDefinition'
import { RelationTarget } from './types'

class OneHasOneDefinition extends FieldDefinition<OneHasOneDefinition.Options> {
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

	createField({ name, conventions, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
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

namespace OneHasOneDefinition {
	export type Options = {
		target: RelationTarget
		inversedBy?: string
		joiningColumn?: Partial<Model.JoiningColumn>
		nullable?: boolean
		orphanRemoval?: true
	}
}

export default OneHasOneDefinition
