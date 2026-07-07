import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor } from '../model/index.js'
import { conditionSchema } from './condition.js'
import * as Typesafe from '@contember/typesafe'

/**
 * Entity-agnostic structural `Input.Where` schema — validates the recursive
 * and/or/not + arbitrary-field shape without a model. Used where no entity is in
 * scope (e.g. type-schema parsing of a persisted retention `where`). Field-level
 * checks (that referenced fields exist) are done by the entity-bound `whereSchema`.
 */
export const anyWhereSchema: Typesafe.Type<Input.Where> = (input: unknown, path: PropertyKey[] = []): Input.Where => {
	const fieldValue = Typesafe.union(anyWhereSchema, Typesafe.array(anyWhereSchema), conditionSchema())
	const schema = Typesafe.intersection(
		Typesafe.partial({
			and: Typesafe.array(anyWhereSchema),
			or: Typesafe.array(anyWhereSchema),
			not: anyWhereSchema,
		}),
		Typesafe.record(Typesafe.string, fieldValue),
	)
	const result: Input.Where = schema(input, path)
	return result
}

export const whereSchema = ({ schema, entity }: {
	schema: Model.Schema
	entity: Model.Entity
}): Typesafe.Type<Input.Where> => {
	return (input: unknown, path: PropertyKey[] = []): Input.Where => {
		const whereSchemaInner = Typesafe.noExtraProps(Typesafe.partial({
			and: Typesafe.array(whereSchema({ schema, entity })),
			or: Typesafe.array(whereSchema({ schema, entity })),
			not: whereSchema({ schema, entity }),
			...Object.fromEntries(
				Object.values(entity.fields).map((it): [string, Typesafe.Type<Input.Where[any]>] => {
					return [
						it.name,
						acceptFieldVisitor(schema, entity, it.name, {
							visitColumn: ({ column }) => conditionSchema(column.type),
							visitRelation: ({ targetEntity }) => whereSchema({ schema, entity: targetEntity }),
						}),
					]
				}),
			),
		}))

		return whereSchemaInner(input, path)
	}
}
