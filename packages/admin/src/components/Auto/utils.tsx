import { PRIMARY_KEY_NAME, Schema, SchemaColumnType, SchemaEntity, SchemaRelation } from '@contember/react-binding'

export const getHumanFriendlyField = (entitySchema: SchemaEntity) => {
	for (const field of ['name', 'title', 'heading', 'label', 'caption', 'slug', 'code', 'description']) {
		if (entitySchema.fields.has(field)) {
			return field
		}
	}

	return PRIMARY_KEY_NAME
}


export const formatString = (type: SchemaColumnType, value: any) => {
	if (typeof value !== 'string') {
		return value

	} else if (type === 'Uuid') {
		return <span title={value}>{value.slice(0, 8)}</span>

	} else if (type === 'String') {
		return value.length > 100 ? <span title={value}>{value.slice(0, 100) + '...'}</span> : value

	} else {
		return value
	}
}

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
