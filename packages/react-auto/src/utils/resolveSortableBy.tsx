import { Schema, SchemaRelation } from '@contember/react-binding'

export const resolveSortableBy = (schema: Schema, field: SchemaRelation) => {
	if (field.type !== 'OneHasMany' || field.side !== 'inverse') {
		return undefined
	}

	if (field.orderBy === null || field.orderBy.length !== 1 || field.orderBy[0].path.length !== 1) {
		return undefined
	}

	const sortableBy = schema.getEntityField(field.targetEntity, field.orderBy[0].path[0])
	return sortableBy.type === 'Integer' ? sortableBy.name : undefined
}
