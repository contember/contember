import { FormGroup, IFormGroupProps, TextArea } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../bindingTypes'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Field from '../coreComponents/Field'
import { SyntheticChildrenProvider } from '../coreComponents/MarkerProvider'
import FieldAccessor from '../dao/FieldAccessor'
import Parser from '../queryLanguage/Parser'
import { TextFieldProps } from './TextField'

export interface TextAreaFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: boolean
	singleLine?: boolean
}

export default class TextAreaField extends React.Component<TextAreaFieldProps> {
	static displayName = 'TextAreaField'

	public render() {
		return Parser.generateWrappedField(this.props.name, fieldName => (
			<Field name={fieldName}>
				{(data: FieldAccessor<string>): React.ReactNode => {
					return (
						<FormGroup label={this.props.label}>
							<TextArea
								value={data.currentValue}
								onChange={this.generateOnChange(data)}
								large={this.props.large}
								fill={true}
							/>
						</FormGroup>
					)
				}}
			</Field>
		))
	}

	private generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLTextAreaElement>) => {
		const str = this.props.singleLine ? e.target.value.replace(/\n/g, ' ') : e.target.value
		data.onChange && data.onChange(str)
	}

	public static generateSyntheticChildren(props: TextFieldProps): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof TextAreaField, SyntheticChildrenProvider>
