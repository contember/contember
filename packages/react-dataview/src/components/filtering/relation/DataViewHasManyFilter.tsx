import { Component, QueryLanguage, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleField, useEnvironment } from '@contember/react-binding'
import * as React from 'react'
import { useMemo } from 'react'
import { DataViewFilterNameContext, DataViewRelationFilterArgsContext } from '../../../contexts'
import { DataViewFilter } from '../DataViewFilter'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createHasManyFilter } from '../../../filterTypes'
import { useFieldEntityName } from '../../../internal/hooks/useFieldEntityName'

export interface DataViewHasManyFilterProps {
	field: SugaredRelativeEntityList['field']
	name?: string
	options?: SugaredQualifiedEntityList['entities']
	queryField?: SugaredRelativeSingleField['field']
	children: React.ReactNode
}

export const DataViewHasManyFilter = Component<DataViewHasManyFilterProps>(({ field, queryField, children, options, name }) => {
	const nameResolved = getFilterName(name, field)
	const optionsResolved = useDataViewHasManyFilterOptions({ options, field })
	const args = useMemo(() => {
		return { options: optionsResolved, queryField }
	}, [optionsResolved, queryField])
	return (
		<DataViewFilterNameContext.Provider value={nameResolved}>
			<DataViewRelationFilterArgsContext.Provider value={args}>
				{children}
			</DataViewRelationFilterArgsContext.Provider>
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createHasManyFilter(field)} />
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
