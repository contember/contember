import {
	EntityAccessor,
	Environment, Filter,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeSingleField,
} from '@contember/binding'
import { ReactElement, ReactNode } from 'react'

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

export type BaseDynamicChoiceField =
	& (
		| {
				options: OptionsAsEntityList
				optionLabel: ReactNode
			}
		| {
				options: OptionsAsFieldList
			}
		| LegacyChoiceFieldWithOptionRenderer
	)
	& {
		searchByFields?: SearchByFields
		createNewForm?: ReactElement
		lazy?: LazyChoiceFieldSettings
		renderedOptionsLimit?: number
	}

export type LazyChoiceFieldSettings =
	| undefined
	| boolean
	| {
		limit?: number
		createFilter?: (input: string) => Filter
	}
