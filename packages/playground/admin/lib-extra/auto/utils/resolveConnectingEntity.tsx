import { Schema, SchemaRelation } from '@contember/react-binding'

export const resolveConnectingEntity = (schema: Schema, field: SchemaRelation, sortableBy: string | undefined) => {
	if (field.type !== 'OneHasMany' || field.side !== 'inverse') {
		return undefined
	}

	const excludedFields = ['id', field.ownedBy, ...sortableBy ? [sortableBy] : []]
	const connectingEntity = schema.getEntity(field.targetEntity)
	const connectingEntityFields = Array.from(connectingEntity.fields.values()).filter(it => !excludedFields.includes(it.name))

	if (connectingEntityFields.length !== 1 || connectingEntityFields[0].__typename !== '_Relation' || connectingEntityFields[0].type !== 'ManyHasOne') {
		return undefined
	}

	return {
		entity: connectingEntity,
		field: connectingEntityFields[0],
	}
}
