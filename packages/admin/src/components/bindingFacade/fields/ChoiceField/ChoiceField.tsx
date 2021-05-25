import { Component } from '@contember/binding'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicChoiceField, DynamicChoiceFieldProps } from './DynamicChoiceField'
import { StaticChoiceField, StaticChoiceFieldProps } from './StaticChoiceField'

export type ChoiceFieldProps<Arity extends ChoiceFieldData.ChoiceArity = ChoiceFieldData.ChoiceArity> = (
	| StaticChoiceFieldProps<Arity>
	| DynamicChoiceFieldProps
) &
	ChoiceFieldData.MetadataPropsByArity

export const ChoiceField: FunctionComponent<ChoiceFieldProps> = Component(props => {
	if (Array.isArray(props.options)) {
		return <StaticChoiceField {...(props as StaticChoiceFieldProps & ChoiceFieldData.MetadataPropsByArity)} />
	}

	return <DynamicChoiceField {...(props as DynamicChoiceFieldProps & ChoiceFieldData.MetadataPropsByArity)} />
}, 'ChoiceField')
