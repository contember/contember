import { Input, Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'

export type OneHasOneOwningRelationTuple = [Model.Entity, Model.OneHasOneOwningRelation]

export const findRelationsWithOrphanRemoval = (schema: Model.Schema, entity: Model.Entity): OneHasOneOwningRelationTuple[] => {
	return Object.values(
		acceptEveryFieldVisitor<OneHasOneOwningRelationTuple | null>(schema, entity, {
			visitColumn: () => null,
			visitManyHasManyInverse: () => null,
			visitManyHasManyOwning: () => null,
			visitOneHasOneInverse: () => null,
			visitOneHasMany: () => null,
			visitOneHasOneOwning: ({ relation, targetEntity }) =>
				relation.orphanRemoval ? [targetEntity, relation] : null,
			visitManyHasOne: () => null,
		}),
	).filter((it): it is OneHasOneOwningRelationTuple => it !== null)
}

export type EntityOwningRelationTuple = [Model.Entity, Model.ManyHasOneRelation | Model.OneHasOneOwningRelation]

export const findOwningRelations = (schema: Model.Schema, entity: Model.Entity): EntityOwningRelationTuple[] => {
	return Object.values(schema.entities)
		.map(entity =>
			acceptEveryFieldVisitor<null | EntityOwningRelationTuple>(schema, entity, {
				visitColumn: () => null,
				visitManyHasManyInverse: () => null,
				visitManyHasManyOwning: () => null,
				visitOneHasOneInverse: () => null,
				visitOneHasMany: () => null,
				visitOneHasOneOwning: ({ relation }): EntityOwningRelationTuple => [entity, relation],
				visitManyHasOne: ({ relation }): EntityOwningRelationTuple => [entity, relation],
			}),
		)
		.reduce<EntityOwningRelationTuple[]>(
			(acc, value) => [
				...acc,
				...Object.values(value).filter<EntityOwningRelationTuple>(
					(it): it is EntityOwningRelationTuple => it !== null,
				),
			],
			[],
		)
		.filter(([{}, relation]) => relation.target === entity.name)
}

export type EntityReferenceRow = { id: Input.PrimaryValue; ref: Input.PrimaryValue }

export const formatConstraintViolationMessage = (
	rows: Pick<EntityReferenceRow, 'id' | 'ref'>[],
	entity: Model.Entity,
	relation: Model.ManyHasOneRelation | Model.OneHasOneOwningRelation,
) => {
	const referencedRows = [...new Set(rows.map(it => it.ref))]
	const referencedRowsSample = referencedRows.slice(0, 10)
	const referencedRowsRemaining = referencedRows.length - referencedRowsSample.length

	const referencingRowsSample = rows.slice(0, 10).map(it => it.id)
	const referencingRowsRemaining = rows.length - referencingRowsSample.length

	return 'Cannot delete ' + referencedRowsSample.join(', ')
		+ (referencedRowsRemaining > 0 ? ` and ${referencedRowsRemaining} more` : '')
		+ ` row(s) of entity ${relation.target}, `
		+ `because it is still referenced from ` + referencingRowsSample.join(', ')
		+ (referencingRowsRemaining > 0 ? ` and ${referencingRowsRemaining} more` : '')
		+ ` row(s) of entity ${entity.name} in relation ${relation.name}.`
}
