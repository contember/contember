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

/** @deprecated */
interface LegacyChoiceFieldWithOptionRenderer {
	renderOption: (entityAccessor: EntityAccessor) => ReactNode
	options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
	optionsStaticRender: ReactElement | ((environment: Environment) => ReactElement)
}

export type OptionsAsEntityList = string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
export type OptionsAsFieldList = string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList

export type SearchByFields =
	| SugaredRelativeSingleField['field']
	| SugaredRelativeSingleField['field'][]

export type BaseDynamicChoiceFieldOptions =
	| {
		options: OptionsAsEntityList
		optionLabel: ReactNode
	}
	| {
		options: OptionsAsFieldList
	}
	| LegacyChoiceFieldWithOptionRenderer

export type BaseDynamicChoiceField =
	& BaseDynamicChoiceFieldOptions
	& SelectFuseOptionsProps<EntityAccessor>
	& {
		searchByFields?: SearchByFields
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
