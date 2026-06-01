import { useDataViewTargetFieldSchemaInternal } from './useTargetFieldSchema.js'

export const useFieldEntityName = (fields: string[]) => {
	const { field: targetField } = useDataViewTargetFieldSchemaInternal(fields)
	if (targetField.__typename !== '_Relation') {
		throw new Error('Invalid field')
	}
	return targetField.targetEntity
}
