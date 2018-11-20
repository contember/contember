import { IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import RichEditor from '../../../components/RichEditor/index'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { Parser } from '../../queryLanguage'
import { TextFieldProps } from './TextField'

export interface RichTextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	allowLineBreaks?: boolean
}

export class RichTextField extends React.PureComponent<RichTextFieldProps> {
	static displayName = 'RichTextField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<string>, env): React.ReactNode => {
					return (
						<RichEditor
							onChange={this.generateOnChange(data)}
							value={data.currentValue || ''}
							allowLineBreaks={this.props.allowLineBreaks}
							label={env.applySystemMiddleware('labelMiddleware', this.props.label)}
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
		return Parser.generateWrappedNode(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof RichTextField,
	SyntheticChildrenProvider<RichTextFieldProps>
>
