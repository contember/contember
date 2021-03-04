import { BindingError, Component, SugaredRelativeSingleField } from '@contember/binding'
import { BaseTextField } from './BaseTextField'
import * as React from 'react'

export interface TextFieldProps extends SugaredRelativeSingleField, BaseTextField {}

export const TextField: React.FunctionComponent<TextFieldProps> = Component(props => {
	throw new BindingError(`BlockEditor.TextField may only appear as an immediate child of a block!`)
})
