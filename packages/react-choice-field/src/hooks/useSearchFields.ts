import { ChoiceFieldSearchByFields } from '../BaseDynamicChoiceField'
import { useMemo } from 'react'
import { QueryLanguage, RelativeSingleField, useEnvironment } from '@contember/react-binding'

export const useSearchFields = (searchByFields: ChoiceFieldSearchByFields | undefined): RelativeSingleField[] => {
	const sugaredSearchFields = useMemo(
		() => (searchByFields === undefined ? [] : Array.isArray(searchByFields) ? searchByFields : [searchByFields]),
		[searchByFields],
	)
	const environment = useEnvironment()
	return useMemo(
		() => sugaredSearchFields.map(field => QueryLanguage.desugarRelativeSingleField(field, environment)),
		[sugaredSearchFields, environment],
	)
}
