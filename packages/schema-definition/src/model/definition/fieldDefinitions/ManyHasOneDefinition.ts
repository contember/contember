import { EntityConstructor,  RelationTarget } from '../types'
import { Model } from '@contember/schema'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'

export class ManyHasOneDefinition extends FieldDefinition<ManyHasOneDefinitionOptions> {
	type = 'ManyHasOneDefinition' as const

	public inversedBy(inversedBy: string): ManyHasOneDefinition {
		return this.withOption('inversedBy', inversedBy)
	}

	public joiningColumn(columnName: string): ManyHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, columnName })
	}

	public onDelete(onDelete: Model.OnDelete | `${Model.OnDelete}`): ManyHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: onDelete as Model.OnDelete })
	}

	public cascadeOnDelete(): ManyHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.cascade })
	}

	public setNullOnDelete(): ManyHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.setNull })
	}

	public restrictOnDelete(): ManyHasOneDefinition {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete: Model.OnDelete.restrict })
	}

	public notNull(): ManyHasOneDefinition {
		return this.withOption('nullable', false)
	}

	public deprecated(deprecationReason?: string): ManyHasOneDefinition {
		return this.withOption('deprecationReason', deprecationReason || 'This field is deprecated')
	}

	public createField({ name, conventions, entityName, entityRegistry, strictDefinitionValidator }: CreateFieldContext): Model.AnyField {
		const options = this.options
		const joiningColumn = options.joiningColumn || {}
		strictDefinitionValidator.validateInverseSide(entityName, name, options)
		strictDefinitionValidator.validateOnCascade(entityName, name, joiningColumn)

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
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
		}
	}

	protected withOption<K extends keyof ManyHasOneDefinitionOptions>(key: K, value: ManyHasOneDefinitionOptions[K]): ManyHasOneDefinition {
		return new ManyHasOneDefinition({ ...this.options, [key]: value })
	}
}

export function manyHasOne(target: EntityConstructor, inversedBy?: string): ManyHasOneDefinition {
	return new ManyHasOneDefinition({ target, inversedBy })
}

export type ManyHasOneDefinitionOptions = {
	target: RelationTarget
	inversedBy?: string
	joiningColumn?: Partial<Model.JoiningColumn>
	nullable?: boolean
	deprecationReason?: string
}
