import { BindingError, Component, SugaredRelativeSingleField } from '@contember/binding'
import { FunctionComponent } from 'react'
import { BaseTextField } from './BaseTextField'

export interface TextFieldProps extends SugaredRelativeSingleField, BaseTextField {}

export const TextField: FunctionComponent<TextFieldProps> = Component(props => {
	throw new BindingError(`BlockEditor.TextField may only appear as an immediate child of a block!`)
})
