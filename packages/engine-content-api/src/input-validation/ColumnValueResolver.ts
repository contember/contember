import { NoDataError, Providers, resolveColumnValue } from '@contember/schema-utils'
import { Model, Value } from '@contember/schema'

export class ColumnValueResolver {
	constructor(private readonly providers: Providers) {}

	getDefaultValidationValue(context: Model.ColumnContext & { input: Value.FieldValue | undefined }): Value.AtomicValue | undefined {
		if (context.column.name === context.entity.primary) {
			return '00000000-0000-0000-0000-000000000000'
		}
		try {
			return resolveColumnValue(context, this.providers)
		} catch (e) {
			if (e instanceof NoDataError) {
				return undefined
			}
			throw e
		}
	}
}
