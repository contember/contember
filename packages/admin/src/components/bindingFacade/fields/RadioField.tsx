import { Component } from '@contember/binding'
import { FormGroupProps } from '@contember/ui'
import { FunctionComponent } from 'react'
import { ChoiceFieldProps } from './ChoiceField'

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
