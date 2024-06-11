import { PRIMARY_KEY_NAME, SchemaEntity } from '@contember/react-binding'

export const getHumanFriendlyField = (entitySchema: SchemaEntity) => {
	for (const field of ['name', 'title', 'heading', 'label', 'caption', 'slug', 'code', 'description']) {
		if (entitySchema.fields.has(field)) {
			return field
		}
	}

	return PRIMARY_KEY_NAME
}
