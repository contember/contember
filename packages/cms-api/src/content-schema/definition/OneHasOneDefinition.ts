import { Model } from 'cms-common'
import FieldDefinition from './FieldDefinition'
import { Interface } from '../../utils/interfaceType'
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

	notNull(): Interface<OneHasOneDefinition> {
		return this.withOption('nullable', false)
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
		}
	}
}

namespace OneHasOneDefinition {
	export type Options = {
		target: RelationTarget
		inversedBy?: string
		joiningColumn?: Partial<Model.JoiningColumn>
		nullable?: boolean
	}
}

export default OneHasOneDefinition
