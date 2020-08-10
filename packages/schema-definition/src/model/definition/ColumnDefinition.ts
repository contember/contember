import { Model } from '@contember/schema'
import { Interface } from './types'
import FieldDefinition from './FieldDefinition'
import EnumDefinition from './EnumDefinition'

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
			...(defaultValue !== undefined ? { default: defaultValue as any } : {}),
		}

		switch (type) {
			case Model.ColumnType.Int:
				return { ...common, type: type, columnType: 'integer' }
			case Model.ColumnType.Double:
				return { ...common, type: type, columnType: 'double precision' }
			case Model.ColumnType.String:
				return { ...common, type: type, columnType: 'text' }
			case Model.ColumnType.Uuid:
				return { ...common, type: type, columnType: 'uuid' }
			case Model.ColumnType.Bool:
				return { ...common, type: type, columnType: 'boolean' }
			case Model.ColumnType.DateTime:
				return { ...common, type: type, columnType: 'timestamptz' }
			case Model.ColumnType.Date:
				return { ...common, type: type, columnType: 'date' }
			case Model.ColumnType.Enum:
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

				return { ...common, type: type, columnType: enumName, enumName: enumName }
			default:
				;(({}: never): never => {
					throw new Error()
				})(type)
		}
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
		default?: Model.ColumnByType<Type>['default']
	} & TypeOptions
}

export default ColumnDefinition
