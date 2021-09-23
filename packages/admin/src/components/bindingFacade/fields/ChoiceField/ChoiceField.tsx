import { Component } from '@contember/binding'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { StaticSingleChoiceField, StaticSingleChoiceFieldProps } from './StaticSingleChoiceField'
import { DynamicSingleChoiceField } from './DynamicSingleChoiceField'
import { DynamicSingleChoiceFieldProps } from './useDynamicSingleChoiceField'

export type ChoiceFieldProps =
	& ChoiceFieldData.SingleChoiceFieldProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

const isStatic = (props: ChoiceFieldProps): props is StaticSingleChoiceFieldProps & ChoiceFieldData.SingleChoiceFieldProps	=>
	Array.isArray(props.options)

export const ChoiceField: FunctionComponent<ChoiceFieldProps> = Component(props => {
	return isStatic(props)
		? <StaticSingleChoiceField {...props} />
		: <DynamicSingleChoiceField {...props} />
}, 'ChoiceField')
