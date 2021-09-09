import {
	Component,
	Field,
	FieldValue,
	OptionallyVariableFieldValue,
	SugaredRelativeSingleField,
} from '@contember/binding'
import { FunctionComponent, ReactNode } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { useStaticSingleChoiceField } from './useStaticSingleChoiceField'

export interface StaticOption {
	label: ReactNode
	description?: ReactNode
}

export interface NormalizedStaticOption extends StaticOption {
	value: FieldValue
	searchKeywords: string
}

export interface OptionallyVariableStaticOption extends StaticOption {
	value: OptionallyVariableFieldValue
	searchKeywords?: string
}

export interface StaticSingleChoiceFieldProps extends SugaredRelativeSingleField {
	options: OptionallyVariableStaticOption[]
}


export const StaticSingleChoiceField: FunctionComponent<StaticSingleChoiceFieldProps & ChoiceFieldData.SingleChoiceFieldProps> =
	Component(
		props => props.children(useStaticSingleChoiceField(props)),
		props => <Field {...props} />,
		'StaticSingleChoiceField',
	)
