import { Model } from '@contember/schema'
import { Interface } from '../types'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { EnumDefinition } from '../EnumDefinition'
import { getColumnType } from '../../utils'

export class ColumnDefinition<Type extends Model.ColumnType> extends FieldDefinition<ColumnDefinitionOptions<Type>> {
	type = 'ColumnDefinition' as const

	public static create<Type extends Model.ColumnType>(
		type: Type,
		typeOptions: ColumnTypeOptions = {},
	): ColumnDefinition<Type> {
		return new ColumnDefinition({
			type: type,
			...typeOptions,
		})
	}

	public columnName(columnName: string): Interface<ColumnDefinition<Type>> {
		return this.withOption('columnName', columnName)
	}

	public columnType(columnType: string): Interface<ColumnDefinition<Type>> {
		return this.withOption('columnType', columnType)
	}

	public nullable(): Interface<ColumnDefinition<Type>> {
		return this.withOption('nullable', true)
	}

	public notNull(): Interface<ColumnDefinition<Type>> {
		return this.withOption('nullable', false)
	}

	public unique(): Interface<ColumnDefinition<Type>> {
		return this.withOption('unique', true)
	}

	public default(value: ColumnDefinition<Type>['options']['default']): Interface<ColumnDefinition<Type>> {
		return this.withOption('default', value)
	}

	public typeAlias(alias: string): Interface<ColumnDefinition<Type>> {
		return this.withOption('typeAlias', alias)
	}

	createField({ name, conventions, enumRegistry, entityName }: CreateFieldContext): Model.AnyField {
		const { type, nullable, columnName, enumDefinition, default: defaultValue, columnType, typeAlias } = this.options
		const common = {
			name: name,
			columnName: columnName || conventions.getColumnName(name),
			nullable: nullable === undefined ? true : nullable,
			...(defaultValue !== undefined ? { default: defaultValue } : {}),
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
			columnType: columnType || getColumnType(type),
			...(typeAlias !== undefined ? { typeAlias } : {}),
		}
	}
}

export function column(type: Model.ColumnType, typeOptions: ColumnTypeOptions = {}) {
	return ColumnDefinition.create(type, typeOptions)
}

export function stringColumn() {
	return column(Model.ColumnType.String)
}

export function intColumn() {
	return column(Model.ColumnType.Int)
}

export function boolColumn() {
	return column(Model.ColumnType.Bool)
}

export function doubleColumn() {
	return column(Model.ColumnType.Double)
}

export function dateColumn() {
	return column(Model.ColumnType.Date)
}

export function dateTimeColumn() {
	return column(Model.ColumnType.DateTime)
}

export function jsonColumn() {
	return column(Model.ColumnType.Json)
}

export function enumColumn(enumDefinition: EnumDefinition) {
	return column(Model.ColumnType.Enum, { enumDefinition })
}

export function uuidColumn() {
	return column(Model.ColumnType.String)
}

export type ColumnTypeOptions = {
	enumDefinition?: EnumDefinition
}
export type ColumnDefinitionOptions<Type extends Model.ColumnType> = {
	type: Model.ColumnType
	columnType?: string
	typeAlias?: string
	columnName?: string
	unique?: boolean
	nullable?: boolean
	default?: Model.ColumnTypeDefinition['default']
} & ColumnTypeOptions
