import FieldProcessor from './FieldProcessor'
import ColumnBuilder from '../ColumnBuilder'
import NamingConventions from '../NamingConventions'
import { Model } from '@contember/schema'

export default class ColumnProcessor implements FieldProcessor<ColumnBuilder.Options> {
	private conventions: NamingConventions

	constructor(conventions: NamingConventions) {
		this.conventions = conventions
	}

	public process(
		entityName: string,
		fieldName: string,
		options: ColumnBuilder.Options,
		registerField: FieldProcessor.FieldRegistrar,
	): void {
		registerField(entityName, this.toColumnType(fieldName, options))
	}

	private toColumnType(fieldName: string, options: ColumnBuilder.Options): Model.Column<Model.ColumnType> {
		const type = options.type
		const common = {
			name: fieldName,
			columnName: options.columnName || this.conventions.getColumnName(fieldName),
			nullable: options.nullable === undefined ? true : options.nullable,
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
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				return { ...common, type: type, columnType: options.enumName!, enumName: options.enumName! }
			default:
				;(({}: never): never => {
					throw new Error()
				})(type)
		}
	}
}
