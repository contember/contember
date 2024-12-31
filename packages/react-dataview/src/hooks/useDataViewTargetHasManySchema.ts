import { useMemo } from 'react'
import { useDataViewTargetFieldSchemaInternal } from '../internal/hooks/useTargetFieldSchema'
import { QueryLanguage, SugaredRelativeEntityList, useEnvironment } from '@contember/react-binding'

/**
 * Utility hook for getting schema of a has-many relation field.
 */
export const useDataViewTargetHasManySchema = (field: SugaredRelativeEntityList['field']) => {
	const environment = useEnvironment()
	const fields = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeEntityList({ field }, environment)
		return [...desugared.hasOneRelationPath.map(it => it.field), desugared.hasManyRelation.field]
	}, [environment, field])
	const { field: fieldSchema, entity } = useDataViewTargetFieldSchemaInternal(fields)
	if (fieldSchema.__typename !== '_Relation') {
		throw new Error('Invalid field')
	}
	return { field: fieldSchema, entity }
}
