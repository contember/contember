import * as React from 'react'
import { useDataViewFilterName, useDataViewRelationFilterArgs } from '../../../contexts'
import { useDataViewRelationFilterFactory } from '../../../hooks'
import { DataView, DataViewProps } from '../../DataView'
import { EntityAccessor } from '@contember/react-binding'
import { useCallback } from 'react'

/**
 * Initializes a data view for selecting relation filter options.
 */
export const DataViewRelationFilterOptions = ({ children, name, ...props }: {
	name?: string
	children: React.ReactNode
} & Omit<DataViewProps, 'entities'>) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const filterFactory = useDataViewRelationFilterFactory(name)
	const { options } = useDataViewRelationFilterArgs()

	const toggleInclude = useCallback((it: EntityAccessor) => {
		const [, set] = filterFactory(it.id)
		set('toggleInclude')
	}, [filterFactory])

	return (
		<DataView
			entities={options}
			onSelectHighlighted={toggleInclude}
			filteringStateStorage="null"
			sortingStateStorage="null"
			currentPageStateStorage="null"
			{...props}
		>
			{children}
		</DataView>
	)
}
