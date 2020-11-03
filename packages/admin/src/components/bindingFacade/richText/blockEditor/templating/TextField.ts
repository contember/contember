import { BindingError, Component, SugaredRelativeSingleField } from '@contember/binding'
import { BaseTextField } from './BaseTextField'

export interface TextFieldProps extends SugaredRelativeSingleField, BaseTextField {}

export const TextField = Component<TextFieldProps>(props => {
	throw new BindingError(`BlockEditor.TextField may only appear as an immediate child of a block!`)
})
