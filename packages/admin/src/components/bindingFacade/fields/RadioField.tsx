import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Component, RelativeSingleField } from '../../../binding'
import { ChoiceFieldProps } from './ChoiceField'

export interface RadioFieldPublicProps extends Omit<FormGroupProps, 'children'> {
	inline?: boolean
	field: string
}

export interface RadioFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type RadioFieldProps = RadioFieldPublicProps & RadioFieldInternalProps

export const RadioField = Component<RadioFieldProps>(props => {
	throw new Error('Not implemented')
}, 'RadioField')
