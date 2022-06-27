import * as Typesafe from '@contember/typesafe'
import { Type } from '@contember/typesafe'
import { Input } from '@contember/schema'

export const conditionSchema = <T>(inner: Typesafe.Type<T>): Type<Input.Condition<T>> => {
	return (input: unknown, path: PropertyKey[] = []): Input.Condition<T> => {
		const self = conditionSchema(inner)
		const objectSchema = Typesafe.partial({
			and: Typesafe.array(self),
			or: Typesafe.array(self),
			not: self,
			eq: inner,
			notEq: inner,
			null: Typesafe.boolean,
			isNull: Typesafe.boolean,
			in: Typesafe.array(inner),
			notIn: Typesafe.array(inner),
			lt: inner,
			lte: inner,
			gt: inner,
			gte: inner,
			never: Typesafe.true_,
			always: Typesafe.true_,
			contains: Typesafe.string,
			startsWith: Typesafe.string,
			endsWith: Typesafe.string,
			containsCI: Typesafe.string,
			startsWithCI: Typesafe.string,
			endsWithCI: Typesafe.string,
		})
		return objectSchema(input, path) as Input.Condition<T>
	}
}
