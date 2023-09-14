import { useMemo } from 'react'
import {
	BaseDynamicChoiceField,
	LazyChoiceFieldSettings,
	ChoiceFieldOptionsAsEntityList,
	ChoiceFieldOptionsAsFieldList,
} from '../BaseDynamicChoiceField'
import {
	Environment,
	Filter,
	QualifiedEntityList,
	QualifiedFieldList,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	useEnvironment,
} from '@contember/react-binding'

export type DesugaredOptionPath = QualifiedFieldList | QualifiedEntityList;


export const useDesugaredOptionPath = (props: BaseDynamicChoiceField, filter: Filter | undefined): DesugaredOptionPath => {
	const environment = useEnvironment()
	const isEntityList = 'optionsStaticRender' in props || 'optionLabel' in props
	const lazy = props.lazy
	return useMemo(() => {
		if (isEntityList) {
			return getDesugaredEntityList(props.options as ChoiceFieldOptionsAsEntityList, environment, lazy, filter)
		}
		return getDesugaredFieldList(props.options as ChoiceFieldOptionsAsFieldList, environment, lazy, filter)
	}, [environment, filter, isEntityList, lazy, props.options])
}

export const getDesugaredEntityList = (options: ChoiceFieldOptionsAsEntityList, environment: Environment, lazyOptions: LazyChoiceFieldSettings, filter: Filter | undefined): QualifiedEntityList => {
	const sugaredList = typeof options === 'string' || !('entities' in options)
		? { entities: options }
		: (options as SugaredQualifiedEntityList)

	const qualifiedEntityList = QueryLanguage.desugarQualifiedEntityList(sugaredList, environment)
	return {
		...qualifiedEntityList,
		filter: filter && qualifiedEntityList.filter ? { and: [filter, qualifiedEntityList.filter] } : (qualifiedEntityList.filter ?? filter),
		limit: getLazyLimit(lazyOptions, filter === undefined) ?? qualifiedEntityList.limit,
	}
}

export const getDesugaredFieldList = (options: ChoiceFieldOptionsAsFieldList, environment: Environment, lazyOptions: LazyChoiceFieldSettings, filter: Filter | undefined): QualifiedFieldList => {
	const sugaredList = typeof options === 'string' || !('fields' in options)
		? { fields: options }
		: (options as SugaredQualifiedFieldList)

	const desugarQualifiedFieldList = QueryLanguage.desugarQualifiedFieldList(sugaredList, environment)
	return {
		...desugarQualifiedFieldList,
		filter: filter && desugarQualifiedFieldList.filter ? { and: [filter, desugarQualifiedFieldList.filter] } : (desugarQualifiedFieldList.filter ?? filter),
		limit: getLazyLimit(lazyOptions, filter === undefined) ?? desugarQualifiedFieldList.limit,
	}
}

const DEFAULT_LAZY_LIMIT = 100
const DEFAULT_LAZY_INIT_LIMIT = 20
export const getLazyLimit = (lazyOptions: LazyChoiceFieldSettings, isInitial: boolean): number | undefined => {
	if (!lazyOptions) {
		return undefined
	}
	const normalized = typeof lazyOptions === 'object' ? lazyOptions : {}
	if (isInitial) {
		return normalized.initialLimit ?? Math.min(normalized.limit ?? DEFAULT_LAZY_INIT_LIMIT, DEFAULT_LAZY_INIT_LIMIT)
	}
	return normalized.limit ?? DEFAULT_LAZY_LIMIT
}
