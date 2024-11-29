import { useTargetFieldSchema } from './useTargetFieldSchema'

export const useFieldEntityName = (fields: string[]) => {
	const targetField = useTargetFieldSchema(fields)
	if (!targetField || targetField.__typename !== '_Relation') {
		throw new Error('Invalid field')
	}
	return targetField.targetEntity
}

