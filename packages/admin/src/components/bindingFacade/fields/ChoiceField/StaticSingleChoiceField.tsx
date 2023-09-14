import {
	Component,
	Field,
	FieldValue,
	OptionallyVariableFieldValue,
	SugaredRelativeSingleField,
} from '@contember/react-binding'
import { FunctionComponent, ReactNode } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { useStaticSingleChoiceField } from './hooks/useStaticSingleChoiceField'
import { SelectFuseOptionsProps } from './hooks/useFuseFilteredOptions'

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

export type StaticSingleChoiceFieldProps =
	& SugaredRelativeSingleField
	& SelectFuseOptionsProps<FieldValue>
	& {
		options: OptionallyVariableStaticOption[]
	}


export const StaticSingleChoiceField: FunctionComponent<StaticSingleChoiceFieldProps & ChoiceFieldData.SingleChoiceFieldProps<FieldValue>> =
	Component(
		props => props.children(useStaticSingleChoiceField(props)),
		props => <Field {...props} />,
		'StaticSingleChoiceField',
	)
