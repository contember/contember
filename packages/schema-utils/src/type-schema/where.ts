import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor } from '../model'
import { conditionSchema } from './condition'
import * as Typesafe from '@contember/typesafe'

export const whereSchema = ({ schema, entity }: {
	schema: Model.Schema
	entity: Model.Entity
}): Typesafe.Type<Input.Where> => {
	return (input: unknown, path: PropertyKey[] = []): Input.Where => {
		const whereSchemaInner = Typesafe.noExtraProps(Typesafe.partial({
			and: Typesafe.array(whereSchema({ schema, entity })),
			or: Typesafe.array(whereSchema({ schema, entity })),
			not: whereSchema({ schema, entity }),
			...Object.fromEntries(Object.values(entity.fields).map((it): [string, Typesafe.Type<Input.Where[any]>] => {
				return [
					it.name,
					acceptFieldVisitor(schema, entity, it.name, {
						visitColumn: ({ column }) => conditionSchema(column.type),
						visitRelation: ({ targetEntity }) => whereSchema({ schema, entity: targetEntity }),
					}),
				]
			})),
		}))

		return whereSchemaInner(input, path)
	}
}
