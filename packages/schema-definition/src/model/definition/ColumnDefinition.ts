import { Model } from '@contember/schema'
import { Interface } from './types'
import FieldDefinition from './FieldDefinition'
import EnumDefinition from './EnumDefinition'
import { getColumnType } from '../utils/getColumnType'

class ColumnDefinition<Type extends Model.ColumnType> extends FieldDefinition<ColumnDefinition.Options<Type>> {
	type = 'ColumnDefinition' as const

	public static create<Type extends Model.ColumnType>(
		type: Type,
		typeOptions: ColumnDefinition.TypeOptions = {},
	): ColumnDefinition<Type> {
		return new ColumnDefinition({
			type: type,
			...typeOptions,
		})
	}

	public columnName(columnName: string): Interface<ColumnDefinition<Type>> {
		return this.withOption('columnName', columnName)
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

	createField({ name, conventions, enumRegistry, entityName }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const { type, nullable, columnName, enumDefinition, default: defaultValue } = this.options
		const common = {
			name: name,
			columnName: columnName || conventions.getColumnName(name),
			nullable: nullable === undefined ? true : nullable,
			...(defaultValue !== undefined ? { default: defaultValue } : {}),
		}
		if (type === Model.ColumnType.Enum) {
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
		return { ...common, type: type, columnType: getColumnType(type) }
	}
}

namespace ColumnDefinition {
	export type TypeOptions = {
		enumDefinition?: EnumDefinition
	}

	export type Options<Type extends Model.ColumnType> = {
		type: Model.ColumnType
		columnName?: string
		unique?: boolean
		nullable?: boolean
		default?: Model.ColumnTypeDefinition['default']
	} & TypeOptions
}

export default ColumnDefinition
