import { useMemo } from 'react'
import { useDataViewTargetFieldSchemaInternal } from '../internal/hooks/useTargetFieldSchema'
import { QueryLanguage, SugaredRelativeSingleEntity, useEnvironment } from '@contember/react-binding'

export const useDataViewTargetHasOneSchema = (field: SugaredRelativeSingleEntity['field']) => {
	const environment = useEnvironment()
	const fields = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeSingleEntity({ field }, environment)
		return desugared.hasOneRelationPath.map(it => it.field)
	}, [environment, field])
	const { field: fieldSchema, entity } = useDataViewTargetFieldSchemaInternal(fields)
	if (fieldSchema.__typename !== '_Relation') {
		throw new Error('Invalid field')
	}
	return { field: fieldSchema, entity }
}
