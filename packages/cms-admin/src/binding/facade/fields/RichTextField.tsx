import { IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import RichEditor, { LineBreakBehavior, RichEditorProps } from '../../../components/RichEditor'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { TextFieldProps } from './TextField'

export { LineBreakBehavior, Block, Mark } from '../../../components/RichEditor'

export interface RichTextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	lineBreakBehavior?: LineBreakBehavior
	blocks?: RichEditorProps['blocks']
}

export class RichTextField extends React.PureComponent<RichTextFieldProps> {
	static displayName = 'RichTextField'

	public render() {
		return (
			<Field<string> name={this.props.name}>
				{({ data, environment }): React.ReactNode => {
					return (
						<RichEditor
							onChange={this.generateOnChange(data)}
							value={data.currentValue || ''}
							lineBreakBehavior={this.props.lineBreakBehavior}
							label={environment.applySystemMiddleware('labelMiddleware', this.props.label)}
							blocks={this.props.blocks}
						/>
					)
				}}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string>) => (val: string) => {
		data.onChange && data.onChange(val)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof RichTextField,
	SyntheticChildrenProvider<RichTextFieldProps>
>
