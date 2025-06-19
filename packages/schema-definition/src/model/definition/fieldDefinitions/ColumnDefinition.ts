import { Model } from '@contember/schema'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { EnumDefinition } from '../EnumDefinition'
import { resolveDefaultColumnType } from '@contember/schema-utils'

export class ColumnDefinition extends FieldDefinition<ColumnDefinitionOptions> {
	type = 'ColumnDefinition' as const

	public static create(
		type: Model.ColumnType,
		typeOptions: ColumnTypeOptions = {},
	): ColumnDefinition {
		return new ColumnDefinition({
			type: type,
			...typeOptions,
		})
	}

	public columnName(columnName: string): ColumnDefinition {
		return this.withOption('columnName', columnName)
	}

	public columnType(columnType: string): ColumnDefinition {
		return this.withOption('columnType', columnType)
	}

	public list(): ColumnDefinition {
		return this.withOption('list', true)
	}

	public nullable(): ColumnDefinition {
		return this.withOption('nullable', true)
	}

	public notNull(): ColumnDefinition {
		return this.withOption('nullable', false)
	}

	public sequence(options?: Partial<Model.ColumnTypeDefinition['sequence']>): ColumnDefinition {
		return this.withOption('sequence', { precedence: 'BY DEFAULT', ...options })
	}

	public unique(options: { timing?: Model.ConstraintTiming } = {}): ColumnDefinition {
		return this.withOption('unique', options)
	}

	public default(value: ColumnDefinition['options']['default']): ColumnDefinition {
		return this.withOption('default', value)
	}

	public typeAlias(alias: string): ColumnDefinition {
		return this.withOption('typeAlias', alias)
	}

	/**
	 * Collation for string columns
	 */
	public collation(collation: Model.Collation): ColumnDefinition {
		return this.withOption('collation', collation)
	}

	public deprecated(deprecationReason?: string): ColumnDefinition {
		return this.withOption('deprecationReason', deprecationReason || 'This field is deprecated')
	}

	public createField({ name, conventions, enumRegistry, entityName, options }: CreateFieldContext): Model.AnyField {
		const { type, nullable, columnName, enumDefinition, default: defaultValue, columnType, typeAlias, sequence, list, collation = options.defaultCollation, deprecationReason } = this.options
		const common = {
			name: name,
			columnName: columnName || conventions.getColumnName(name),
			nullable: nullable === undefined ? true : nullable,
			...(list ? { list } : {}),
			...(defaultValue !== undefined ? { default: defaultValue } : {}),
			...(sequence !== undefined ? { sequence } : {}),
			...(type === Model.ColumnType.String && collation !== undefined ? { collation } : {}),
			...(deprecationReason !== undefined ? { deprecationReason } : {}),
		}
		if (type === Model.ColumnType.Enum) {
			if (typeAlias) {
				throw new Error('GraphQL type alias cannot be specified for enum type')
			}
			let enumName: string
			if (!enumDefinition) {
				throw new Error()
			}
			if (enumRegistry.has(enumDefinition)) {
				enumName = enumRegistry.getName(enumDefinition)
			} else {
				enumName = entityName + name.substring(0, 1).toUpperCase() + name.substring(1)
				enumRegistry.register(enumName, enumDefinition)
			}

			return { ...common, type: type, columnType: enumName }
		}
		return {
			...common,
			type: type,
			columnType: columnType || resolveDefaultColumnType(type),
			...(typeAlias !== undefined ? { typeAlias } : {}),
		}
	}

	protected withOption<K extends keyof ColumnDefinitionOptions>(key: K, value: ColumnDefinitionOptions[K]): ColumnDefinition {
		return new ColumnDefinition({ ...this.options, [key]: value })
	}
}

export function column(type: Model.ColumnType, typeOptions: ColumnTypeOptions = {}) {
	return ColumnDefinition.create(type, typeOptions)
}

export function stringColumn(): ColumnDefinition {
	return column(Model.ColumnType.String)
}

export function intColumn(): ColumnDefinition {
	return column(Model.ColumnType.Int)
}

export function boolColumn(): ColumnDefinition {
	return column(Model.ColumnType.Bool)
}

export function doubleColumn(): ColumnDefinition {
	return column(Model.ColumnType.Double)
}

export function dateColumn(): ColumnDefinition {
	return column(Model.ColumnType.Date)
}

export function timeColumn(): ColumnDefinition {
	return column(Model.ColumnType.Time)
}

export function dateTimeColumn(args?: { precision?: number }): ColumnDefinition {
	const col = column(Model.ColumnType.DateTime)
	if (!args?.precision) {
		return col
	}
	return col.columnType(`${resolveDefaultColumnType(Model.ColumnType.DateTime)}(${args.precision})`)
}

export function jsonColumn(): ColumnDefinition {
	return column(Model.ColumnType.Json)
}

export function enumColumn(enumDefinition: EnumDefinition): ColumnDefinition {
	return column(Model.ColumnType.Enum, { enumDefinition })
}

export function uuidColumn(): ColumnDefinition {
	return column(Model.ColumnType.Uuid)
}

export type ColumnTypeOptions = {
	enumDefinition?: EnumDefinition
}

export type ColumnDefinitionOptions = {
	type: Model.ColumnType
	columnType?: string
	list?: boolean
	typeAlias?: string
	columnName?: string
	unique?: { timing?: Model.ConstraintTiming }
	nullable?: boolean
	default?: Model.ColumnTypeDefinition['default']
	sequence?: Model.ColumnTypeDefinition['sequence']
	collation?: Model.Collation
	deprecationReason?: string
} & ColumnTypeOptions
