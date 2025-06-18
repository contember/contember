import FieldProcessor from './FieldProcessor'
import ColumnBuilder from '../ColumnBuilder'
import { Model } from '@contember/schema'
import { NamingConventions, resolveDefaultColumnType } from '@contember/schema-utils'

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
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
		}
		if (type === Model.ColumnType.Enum) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return { ...common, type: type, columnType: options.enumName! }
		}
		return {
			...common,
			type,
			columnType: resolveDefaultColumnType(type),
			...(options.typeAlias !== undefined ? { typeAlias: options.typeAlias } : {}),
		}
	}
}
