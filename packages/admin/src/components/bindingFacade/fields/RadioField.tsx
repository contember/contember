import { Component } from '@contember/binding'
import type { FormGroupProps } from '@contember/ui'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldProps } from './ChoiceField'

export interface RadioFieldPublicProps extends Omit<FormGroupProps, 'children'> {
	inline?: boolean
	field: string
}

export interface RadioFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type RadioFieldProps = RadioFieldPublicProps & RadioFieldInternalProps

export const RadioField: FunctionComponent<RadioFieldProps> = Component(props => {
	throw new Error('Not implemented')
}, 'RadioField')
