import { useMemo } from 'react'
import { useDataViewTargetFieldSchemaInternal } from '../internal/hooks/useTargetFieldSchema'
import { QueryLanguage, SugaredRelativeSingleField, useEnvironment } from '@contember/react-binding'

export const useDataViewTargetFieldSchema = (field: SugaredRelativeSingleField['field']) => {
	const environment = useEnvironment()
	const fields = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeSingleField({ field }, environment)
		return [...desugared.hasOneRelationPath.map(it => it.field), desugared.field]
	}, [environment, field])
	const { field: fieldSchema, entity } = useDataViewTargetFieldSchemaInternal(fields)
	if (fieldSchema.__typename !== '_Column') {
		throw new Error('Invalid field')
	}
	return { field: fieldSchema, entity }
}
