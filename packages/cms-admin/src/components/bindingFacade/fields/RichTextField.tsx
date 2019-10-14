import { TextInputOwnProps } from '@contember/ui'
import * as React from 'react'
import { Component, Field, FieldAccessor, QueryLanguage } from '../../../binding'
import RichEditor, { LineBreakBehavior, RichEditorProps } from '../../RichEditor'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'

export { LineBreakBehavior, Block as BlockType, Mark } from '../../RichEditor'

export type RichTextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputOwnProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'> & {
		lineBreakBehavior?: LineBreakBehavior
		blocks?: RichEditorProps['blocks']
	}

export const RichTextField = Component<RichTextFieldProps>(
	props => (
		<Field<string> name={props.name} defaultValue={props.defaultValue}>
			{fieldMetadata => {
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
			}}
		</Field>
	),
	(props, environment) => (
		<>
			{QueryLanguage.wrapRelativeSingleField(props.name, environment)}
			{props.label}
			{props.labelDescription}
			{props.description}
		</>
	),
	'RichTextField',
)
