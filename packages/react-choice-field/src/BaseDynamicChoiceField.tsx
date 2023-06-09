import {
	EntityAccessor,
	Environment,
	Filter,
	SugaredFieldProps,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeSingleField,
} from '@contember/react-binding'
import { ReactElement, ReactNode } from 'react'
import { SelectFuseOptionsProps } from './hooks/useFuseFilteredOptions'
import { ChoiceFieldOptions } from './ChoiceFieldOptions'

/** @deprecated use optionLabel */
export interface LegacyChoiceFieldWithOptionRenderer {
	renderOption: (entityAccessor: EntityAccessor) => ReactNode
	options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
	optionsStaticRender: ReactElement | ((environment: Environment) => ReactElement)
}

export type ForbidKeys<A, B> = {
	[K in Exclude<keyof A, keyof B>]?: never
}

export type ChoiceFieldOptionsAsEntityList =
	| string
	| (SugaredQualifiedEntityList['entities'] & ForbidKeys<SugaredQualifiedEntityList, SugaredQualifiedEntityList['entities']>)
	| (SugaredQualifiedEntityList & ForbidKeys<SugaredQualifiedEntityList['entities'], SugaredQualifiedEntityList>)

export type ChoiceFieldOptionsAsFieldList =
	| string
	| (SugaredQualifiedFieldList['fields'] & ForbidKeys<SugaredQualifiedFieldList, SugaredQualifiedFieldList['fields']>)
	| (SugaredQualifiedFieldList & ForbidKeys<SugaredQualifiedFieldList['fields'], SugaredQualifiedFieldList>)

export type ChoiceFieldSearchByFields =
	| SugaredRelativeSingleField['field']
	| SugaredRelativeSingleField['field'][]

export type DynamicChoiceFieldWithCustomLabelProps = {
	options: ChoiceFieldOptionsAsEntityList
	optionLabel: ReactNode
}

export type DynamicChoiceFieldOptionProps = {
	options: ChoiceFieldOptionsAsFieldList
}

export type BaseDynamicChoiceFieldOptions =
	| DynamicChoiceFieldOptionProps
	| DynamicChoiceFieldWithCustomLabelProps
	| LegacyChoiceFieldWithOptionRenderer


export type BaseDynamicChoiceField =
	& BaseDynamicChoiceFieldOptions
	& SelectFuseOptionsProps<EntityAccessor>
	& {
		searchByFields?: ChoiceFieldSearchByFields
		lazy?: LazyChoiceFieldSettings
		renderedOptionsLimit?: number
		transformOptions?: (data: ChoiceFieldOptions<EntityAccessor>, input: string | undefined) => ChoiceFieldOptions<EntityAccessor>
		sortableBy?: SugaredFieldProps['field']
	}

export type LazyChoiceFieldSettings =
	| undefined
	| boolean
	| {
		limit?: number
		initialLimit?: number
		createFilter?: (input: string) => Filter
		inputDebounceDelay?: number
	}
