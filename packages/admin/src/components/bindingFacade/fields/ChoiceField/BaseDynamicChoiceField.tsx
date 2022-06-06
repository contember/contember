import {
	EntityAccessor,
	Environment,
	Filter,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeSingleField,
} from '@contember/binding'
import { ReactElement, ReactNode } from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'
import Fuse from 'fuse.js'

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
		fuseOptions?:
			| Fuse.IFuseOptions<ChoiceFieldData.SingleDatum<EntityAccessor>>
			| boolean
		renderedOptionsLimit?: number
		transformOptions?: (data: ChoiceFieldData.Data<EntityAccessor>, input: string) => ChoiceFieldData.Data<EntityAccessor>
	}

export type LazyChoiceFieldSettings =
	| undefined
	| boolean
	| {
		limit?: number
		createFilter?: (input: string) => Filter
		inputDebounceDelay?: number
	}
