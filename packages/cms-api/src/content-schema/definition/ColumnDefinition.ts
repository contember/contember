import FieldDefinition from './FieldDefinition'
import { Model } from 'cms-common'
import { Interface } from '../../utils/interfaceType'
import EnumDefinition from './EnumDefinition'

class ColumnDefinition extends FieldDefinition<ColumnDefinition.Options> {
	type = 'ColumnDefinition' as const

	public static create(type: Model.ColumnType, typeOptions: ColumnDefinition.TypeOptions = {}): ColumnDefinition {
		return new ColumnDefinition({
			type: type,
			...typeOptions,
		})
	}

	public columnName(columnName: string): Interface<ColumnDefinition> {
		return this.withOption('columnName', columnName)
	}

	public nullable(): Interface<ColumnDefinition> {
		return this.withOption('nullable', true)
	}

	public notNull(): Interface<ColumnDefinition> {
		return this.withOption('nullable', false)
	}

	public unique(): Interface<ColumnDefinition> {
		return this.withOption('unique', true)
	}

	createField({ name, conventions, enumRegistry, entityName }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const { type, nullable, columnName, enumDefinition } = this.options
		const common = {
			name: name,
			columnName: columnName || conventions.getColumnName(name),
			nullable: nullable === undefined ? true : nullable,
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
				return { ...common, type: type, columnType: 'timestamp' }
			case Model.ColumnType.Date:
				return { ...common, type: type, columnType: 'date' }
			case Model.ColumnType.Enum:
				let enumName: string
				if (enumRegistry.has(enumDefinition!)) {
					enumName = enumRegistry.getName(enumDefinition!)
				} else {
					enumName = entityName + name.substring(0, 1).toUpperCase() + name.substring(1)
					enumRegistry.register(enumName, enumDefinition!)
				}

				return { ...common, type: type, columnType: enumName!, enumName: enumName! }
			default:
				;(({  }: never): never => {
					throw new Error()
				})(type)
		}
	}
}

namespace ColumnDefinition {
	export type TypeOptions = {
		enumDefinition?: EnumDefinition
	}

	export type Options = {
		type: Model.ColumnType
		columnName?: string
		unique?: boolean
		nullable?: boolean
	} & TypeOptions
}

export default ColumnDefinition
