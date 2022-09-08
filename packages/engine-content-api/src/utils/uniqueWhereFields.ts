import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'

type SingleUnique = readonly string[]
export const getFieldsForUniqueWhere = (schema: Model.Schema, entity: Model.Entity): readonly (SingleUnique)[] => {
	const relations = Object.values(
		acceptEveryFieldVisitor<undefined | [string]>(schema, entity, {
			visitColumn: () => undefined,
			visitManyHasManyInverse: () => undefined,
			visitManyHasManyOwning: () => undefined,
			visitOneHasMany: ({ relation }) => [relation.name],
			visitManyHasOne: () => undefined,
			visitOneHasOneInverse: ({ relation }) => [relation.name],
			visitOneHasOneOwning: ({ relation }) => [relation.name],
		}),
	).filter((it): it is [string] => !!it)

	return [[entity.primary], ...Object.values(entity.unique).map(it => it.fields), ...relations]
}
