import {
	EntityAccessor,
	Environment,
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

export type BaseDynamicChoiceField =
	& (
		| {
				options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
				optionLabel: ReactNode
			}
		| {
				options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
			}
		| LegacyChoiceFieldWithOptionRenderer
	)
	& {
		searchByFields?: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]
		createNewForm?: ReactElement
	}


