import {
	EntityAccessor,
	Environment,
	Filter,
	SugaredFieldProps,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeSingleField,
} from '@contember/binding'
import { ReactElement, ReactNode } from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'
import { SelectFuseOptionsProps } from './hooks/useFuseFilteredOptions'

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
		createNewForm?: ReactElement
		lazy?: LazyChoiceFieldSettings
		renderedOptionsLimit?: number
		transformOptions?: (data: ChoiceFieldData.Options<EntityAccessor>, input: string | undefined) => ChoiceFieldData.Options<EntityAccessor>
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
