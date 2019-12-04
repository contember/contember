import { TextInputOwnProps } from '@contember/ui'
import * as React from 'react'
import {
	Component,
	Field,
	FieldAccessor,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '../../../binding'
import RichEditor, { LineBreakBehavior, RichEditorProps } from '../../RichEditor'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'

export { LineBreakBehavior, Block as BlockType, Mark } from '../../RichEditor'

export type RichTextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputOwnProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'> & {
		lineBreakBehavior?: LineBreakBehavior
		blocks?: RichEditorProps['blocks']
	}

export const RichTextField = Component<RichTextFieldProps>(
	props => {
		const environment = useEnvironment()
		const isMutating = useMutationState()
		const field = useRelativeSingleField<string>(props)
		const generateOnChange = React.useCallback(
			(data: FieldAccessor<string>) => (val: string) => {
				data.updateValue && data.updateValue(!val && data.persistedValue === null ? null : val)
			},
			[],
		)
		return (
			<RichEditor
				onChange={generateOnChange(field)}
				value={field.currentValue || ''}
				lineBreakBehavior={props.lineBreakBehavior}
				label={environment.applySystemMiddleware('labelMiddleware', props.label)}
				blocks={props.blocks}
				readOnly={isMutating}
				{...props}
			/>
		)
	},
	props => (
		<>
			<Field name={props.name} />
			{props.label}
			{props.labelDescription}
			{props.description}
		</>
	),
	'RichTextField',
)
