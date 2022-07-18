import * as Typesafe from '@contember/typesafe'
import { Type } from '@contember/typesafe'
import { Input, Model, Value } from '@contember/schema'

export const conditionSchema = <T extends Value.FieldValue>(type?: Model.ColumnType): Type<Input.Condition<T>> => {
	const metadata = type ? resolveColumnMetadata(type) : { type: Typesafe.scalar }
	return conditionSchemaInner(metadata)
}

interface ResolvedColumnMetadata<T> {
	type: Typesafe.Type<T>
	isJson?: boolean
	isString?: boolean
}

const conditionSchemaInner = <T>(metadata: ResolvedColumnMetadata<T>): Type<Input.Condition<T>> => {
	return (input: unknown, path: PropertyKey[] = []): Input.Condition<T> => {
		const self = conditionSchemaInner(metadata)
		const inner = metadata.type
		const objectSchema = Typesafe.noExtraProps(Typesafe.partial({
			and: Typesafe.array(self),
			or: Typesafe.array(self),
			not: self,
			null: Typesafe.boolean,
			isNull: Typesafe.boolean,
			never: Typesafe.true_,
			always: Typesafe.true_,
			...(metadata.isJson !== true ? {
				eq: inner,
				notEq: inner,
				in: Typesafe.array(inner),
				notIn: Typesafe.array(inner),
				lt: inner,
				lte: inner,
				gt: inner,
				gte: inner,
			} : {}),
			...(metadata.isString !== false ? {
				contains: Typesafe.string,
				startsWith: Typesafe.string,
				endsWith: Typesafe.string,
				containsCI: Typesafe.string,
				startsWithCI: Typesafe.string,
				endsWithCI: Typesafe.string,
			} : {}),
		}))
		return objectSchema(input, path) as Input.Condition<T>
	}
}

const resolveColumnMetadata = (type: Model.ColumnType): ResolvedColumnMetadata<any> => {
	const resolvedType = Typesafe.nullable(resolveColumnTypeSchema(type))
	return {
		type: resolvedType,
		isJson: type === Model.ColumnType.Json,
		isString: type === Model.ColumnType.String,

	}
}


const resolveColumnTypeSchema = (type: Model.ColumnType) => {
	switch (type) {
		case Model.ColumnType.Bool:
			return Typesafe.boolean

		// todo: validate format of string-like inputs uuid, date, enum
		case Model.ColumnType.Date:
		case Model.ColumnType.DateTime:
		case Model.ColumnType.Uuid:
		case Model.ColumnType.Enum:
		case Model.ColumnType.String:
			return Typesafe.string
		case Model.ColumnType.Double:
			return Typesafe.number
		case Model.ColumnType.Int:
			return Typesafe.integer
		case Model.ColumnType.Json:
			return Typesafe.anyJson
	}
}
