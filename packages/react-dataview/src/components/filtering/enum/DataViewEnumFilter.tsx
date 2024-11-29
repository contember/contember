import { Component, QueryLanguage, SugaredRelativeSingleField, useEnvironment } from '@contember/react-binding'
import * as React from 'react'
import { useMemo } from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createEnumFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { useTargetFieldSchema } from '../../../internal/hooks/useTargetFieldSchema'
import { DataViewEnumFilterArgsContext, DataViewFilterNameContext } from '../../../contexts'


export interface DataViewEnumFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewEnumFilter = Component< DataViewEnumFilterProps>(({ field, children, name }) => {
	const enumName = useDataViewFilterEnumName({ field })
	name ??= getFilterName(name, field)

	return (
		<DataViewFilterNameContext.Provider value={name}>
			<DataViewEnumFilterArgsContext.Provider value={{ enumName }}>
				{children}
			</DataViewEnumFilterArgsContext.Provider>
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createEnumFilter(field)} >
		{children}
	</DataViewFilter>
))


const useDataViewFilterEnumName = ({ field }: { field: SugaredRelativeSingleField['field'] }) => {
	const environment = useEnvironment()
	const fields = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeSingleField({ field }, environment)
		return [...desugared.hasOneRelationPath.map(it => it.field), desugared.field]
	}, [environment, field])
	const targetField = useTargetFieldSchema(fields)
	if (!targetField || targetField.__typename !== '_Column' || !targetField.enumName) {
		throw new Error('Invalid field')
	}
	return targetField.enumName
}
