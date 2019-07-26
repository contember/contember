import { IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import RichEditor, { LineBreakBehavior, RichEditorProps } from '../../../components/RichEditor'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../auxiliary'

export { LineBreakBehavior, Block, Mark } from '../../../components/RichEditor'

export interface RichTextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	lineBreakBehavior?: LineBreakBehavior
	blocks?: RichEditorProps['blocks']
}

export const RichTextField = SimpleRelativeSingleField<RichTextFieldProps>(props => {
	const generateOnChange = (data: FieldAccessor<string>) => (val: string) => {
		data.onChange && data.onChange(val)
	}
	return (
		<Field<string> name={props.name}>
			{({ data, isMutating, environment }): React.ReactNode => {
				return (
					<RichEditor
						onChange={generateOnChange(data)}
						value={data.currentValue || ''}
						lineBreakBehavior={props.lineBreakBehavior}
						label={environment.applySystemMiddleware('labelMiddleware', props.label)}
						blocks={props.blocks}
						readOnly={isMutating}
					/>
				)
			}}
		</Field>
	)
}, 'RichTextField')
