import { Model } from '@contember/schema'
import { EntityConstructor, RelationTarget } from '../types'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'

export class OneHasOneDefinition extends FieldDefinition<OneHasOneDefinitionOptions> {
	type = 'OneHasOneDefinition' as const


	public inversedBy(inversedBy: string): OneHasOneDefinition {
		return this.withOption('inversedBy', inversedBy)
	}

	public joiningColumn(columnName: string): OneHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.joiningColumn, columnName })
	}

	public onDelete(onDelete: Model.OnDelete | `${Model.OnDelete}`): OneHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.joiningColumn, onDelete: onDelete as Model.OnDelete })
	}

	public cascadeOnDelete(): OneHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.cascade })
	}

	public setNullOnDelete(): OneHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.setNull })
	}

	public restrictOnDelete(): OneHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.restrict })
	}

	public notNull(): OneHasOneDefinition {
		return this.withOption('nullable', false)
	}

	public deprecated(deprecationReason?: string): OneHasOneDefinition {
		return this.withOption('deprecationReason', deprecationReason || 'This field is deprecated')
	}

	public removeOrphan(): OneHasOneDefinition {
		return this.withOption('orphanRemoval', true)
	}

	public createField({ name, conventions, entityRegistry, strictDefinitionValidator, entityName }: CreateFieldContext): Model.AnyField {
		const options = this.options
		const joiningColumn: Partial<Model.JoiningColumn> = options.joiningColumn || {}

		strictDefinitionValidator.validateInverseSide(entityName, name, options)
		strictDefinitionValidator.validateOnCascade(entityName, name, joiningColumn)

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
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
		}
	}

	protected withOption<K extends keyof OneHasOneDefinitionOptions>(key: K, value: OneHasOneDefinitionOptions[K]): OneHasOneDefinition {
		return new OneHasOneDefinition({ ...this.options, [key]: value })
	}
}


export function oneHasOne(target: EntityConstructor, inversedBy?: string): OneHasOneDefinition {
	return new OneHasOneDefinition({ target, inversedBy })
}

export type OneHasOneDefinitionOptions = {
	target: RelationTarget
	inversedBy?: string
	joiningColumn?: Partial<Model.JoiningColumn>
	nullable?: boolean
	orphanRemoval?: true
	deprecationReason?: string
}
