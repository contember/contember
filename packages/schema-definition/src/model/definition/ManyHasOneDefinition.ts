import { Interface } from './types'
import { Model } from '@contember/schema'
import FieldDefinition from './FieldDefinition'
import { RelationTarget } from './types'

class ManyHasOneDefinition extends FieldDefinition<ManyHasOneDefinition.Options> {
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

	createField({ name, conventions, entityName, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
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

namespace ManyHasOneDefinition {
	export type Options = {
		target: RelationTarget
		inversedBy?: string
		joiningColumn?: Partial<Model.JoiningColumn>
		nullable?: boolean
	}
}

export default ManyHasOneDefinition
