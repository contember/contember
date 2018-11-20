import { FormGroup, IFormGroupProps, TextArea } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { Parser } from '../../queryLanguage'
import { TextFieldProps } from './TextField'

export interface TextAreaFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: boolean
}

export class TextAreaField extends React.PureComponent<TextAreaFieldProps> {
	static displayName = 'TextAreaField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<string | null>, env): React.ReactNode => (
					<FormGroup label={env.applySystemMiddleware('labelMiddleware', this.props.label)}>
						<TextArea
							value={data.currentValue || ''}
							onChange={this.generateOnChange(data)}
							large={this.props.large}
							fill={true}
						/>
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string | null, string>) => (e: ChangeEvent<HTMLTextAreaElement>) => {
		data.onChange && data.onChange(e.target.value)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedNode(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof TextAreaField,
	SyntheticChildrenProvider<TextAreaFieldProps>
>
