import { Component, QueryLanguage, SugaredQualifiedEntityList, useEnvironment } from '@contember/react-binding'
import * as React from 'react'
import { useMemo } from 'react'
import { DataViewFilterNameContext, DataViewRelationFilterArgsContext } from '../../../contexts'
import { DataViewFilter } from '../DataViewFilter'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createHasOneFilter } from '../../../filterTypes'
import { SugaredRelativeSingleEntity } from '@contember/react-binding'
import { useFieldEntityName } from '../../../internal/hooks/useFieldEntityName'

export interface DataViewHasOneFilterProps {
	/**
	 * The field to filter by.
	 */
	field: SugaredRelativeSingleEntity['field']
	/**
	 * An optional custom name for the filter.
	 * Defaults to the field name if not provided.
	 */
	name?: string
	/**
	 * Optional list of entities to filter by.
	 * If not provided, the filter will use the entity associated with the field.
	 */
	options?: SugaredQualifiedEntityList['entities']
	/**
	 * The content or UI controls to render inside the filter.
	 */
	children: React.ReactNode
}

/**
 * Provides a has-one filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, options, children
 *
 * See {@link DataViewHasOneFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewHasOneFilter field="author">
 *     //  Filter controls here 
 * <DataViewFilterName>
 * ```
 */
export const DataViewHasOneFilter = Component< DataViewHasOneFilterProps>(({ children, field, name, options }) => {
	const nameResolved = getFilterName(name, field)
	const optionsResolved = useDataViewHasOneFilterOptions({ options, field })
	const args = useMemo(() => {
		return { options: optionsResolved  }
	}, [optionsResolved])
	return (
		<DataViewFilterNameContext.Provider value={nameResolved}>
			<DataViewRelationFilterArgsContext.Provider value={args}>
				{children}
			</DataViewRelationFilterArgsContext.Provider>
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field, children }) => {
	return <>
		<DataViewFilter name={getFilterName(name, field)} filterHandler={createHasOneFilter(field)} />
	</>
})


const useDataViewHasOneFilterOptions = ({ options, field }: Pick<DataViewHasOneFilterProps, 'options' | 'field'>) => {
	const environment = useEnvironment()
	const fields = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeSingleEntity({ field }, environment)
		return  desugared.hasOneRelationPath.map(it => it.field)
	}, [environment, field])
	const fieldEntityName = useFieldEntityName(fields)

	return useMemo(() => {
		if (options) {
			return options
		}
		return fieldEntityName
	}, [options, fieldEntityName])
}
