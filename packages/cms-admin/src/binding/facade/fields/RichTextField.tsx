import { TextInputProps } from '@contember/ui'
import * as React from 'react'
import RichEditor, { LineBreakBehavior, RichEditorProps } from '../../../components/RichEditor'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export { LineBreakBehavior, Block, Mark } from '../../../components/RichEditor'

export type RichTextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'> & {
		lineBreakBehavior?: LineBreakBehavior
		blocks?: RichEditorProps['blocks']
	}

export const RichTextField = SimpleRelativeSingleField<RichTextFieldProps, string>((fieldMetadata, props) => {
	const generateOnChange = (data: FieldAccessor<string>) => (val: string) => {
		data.updateValue && data.updateValue(val)
	}
	return (
		<RichEditor
			onChange={generateOnChange(fieldMetadata.data)}
			value={fieldMetadata.data.currentValue || ''}
			lineBreakBehavior={props.lineBreakBehavior}
			label={fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
			blocks={props.blocks}
			readOnly={fieldMetadata.isMutating}
			{...props}
		/>
	)
}, 'RichTextField')
