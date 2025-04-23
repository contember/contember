import { Component, QueryLanguage, SugaredQualifiedEntityList, SugaredRelativeEntityList, useEnvironment } from '@contember/react-binding'
import * as React from 'react'
import { useMemo } from 'react'
import { DataViewFilterNameContext, DataViewRelationFilterArgsContext } from '../../../contexts'
import { DataViewFilter } from '../DataViewFilter'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createHasManyFilter } from '../../../filterTypes'
import { useFieldEntityName } from '../../../internal/hooks/useFieldEntityName'

export interface DataViewHasManyFilterProps {
	/**
	 * The field to filter by.
	 */
	field: SugaredRelativeEntityList['field']

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
 * Provides a has-many filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, options, children
 *
 * See {@link DataViewHasManyFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewHasManyFilter field="tags">
 *     //  Filter controls here 
 * <DataViewFilterName>
 * ```
 */
export const DataViewHasManyFilter = Component<DataViewHasManyFilterProps>(({ field, children, options, name }) => {
	const nameResolved = getFilterName(name, field)
	const optionsResolved = useDataViewHasManyFilterOptions({ options, field })
	const args = useMemo(() => {
		return { options: optionsResolved }
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
		<DataViewFilter name={getFilterName(name, field)} filterHandler={createHasManyFilter(field)} />
	</>
})


const useDataViewHasManyFilterOptions = ({ options, field }: Pick<DataViewHasManyFilterProps, 'options' | 'field'>) => {
	const environment = useEnvironment()
	const fields = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeEntityList({ field }, environment)
		return [...desugared.hasOneRelationPath.map(it => it.field), desugared.hasManyRelation.field]
	}, [environment, field])
	const fieldEntityName = useFieldEntityName(fields)

	return useMemo(() => {
		if (options) {
			return options
		}
		return fieldEntityName
	}, [options, fieldEntityName])
}
