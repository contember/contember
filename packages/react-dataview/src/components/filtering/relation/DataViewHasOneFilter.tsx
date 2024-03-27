import { Component, QueryLanguage, SugaredQualifiedEntityList, SugaredRelativeSingleField, useEnvironment } from '@contember/react-binding'
import * as React from 'react'
import { useMemo } from 'react'
import { DataViewFilterNameContext, DataViewRelationFilterArgsContext } from '../../../contexts'
import { DataViewFilter } from '../DataViewFilter'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createHasOneFilter } from '../../../filterTypes'
import { SugaredRelativeSingleEntity } from '@contember/binding'
import { useFieldEntityName } from '../../../internal/hooks/useFieldEntityName'

export interface DataViewHasOneFilterProps {
	field: SugaredRelativeSingleEntity['field']
	name?: string
	options?: SugaredQualifiedEntityList['entities']
	filterField?: SugaredRelativeSingleField['field']
	children: React.ReactNode
}

export const DataViewHasOneFilter = Component< DataViewHasOneFilterProps>(({ children, filterField, field, name, options }) => {
	const nameResolved = getFilterName(name, field)
	const optionsResolved = useDataViewHasOneFilterOptions({ options, field })
	const args = useMemo(() => {
		return { options: optionsResolved, filterField }
	}, [optionsResolved, filterField])
	return (
		<DataViewFilterNameContext.Provider value={nameResolved}>
			<DataViewRelationFilterArgsContext.Provider value={args}>
				{children}
			</DataViewRelationFilterArgsContext.Provider>
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createHasOneFilter(field)} />
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
