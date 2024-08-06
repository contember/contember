import { SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/react-binding'

export type SugaredFields =
	| SugaredRelativeSingleField['field']
	| SugaredRelativeSingleEntity['field']
	| SugaredRelativeEntityList['field']

export const getFilterName = (name: string | undefined, field: SugaredFields): string => {
	const resolvedName = name ?? field
	if (typeof resolvedName === 'string') {
		return resolvedName
	}

	throw new Error('Please provide a name for the filter')
}
