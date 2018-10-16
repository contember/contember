import { FormGroup, IFormGroupProps, IInputGroupProps, InputGroup } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../bindingTypes'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Field from '../coreComponents/Field'
import { SyntheticChildrenProvider } from '../coreComponents/MarkerProvider'
import FieldAccessor from '../dao/FieldAccessor'
import Parser from '../queryLanguage/Parser'

export interface TextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: IInputGroupProps['large']
	inlineLabel?: boolean
}

export default class TextField extends React.Component<TextFieldProps> {
	static displayName = 'TextField'

	public render() {
		return Parser.generateWrappedField(this.props.name, fieldName => (
			<Field name={fieldName}>
				{(data: FieldAccessor<string | null, string>): React.ReactNode => {
					return (
						<FormGroup label={this.props.label} inline={this.props.inlineLabel}>
							<InputGroup
								value={data.currentValue || ''}
								onChange={this.generateOnChange(data)}
								large={this.props.large}
							/>
						</FormGroup>
					)
				}}
			</Field>
		))
	}

	private generateOnChange = (data: FieldAccessor<string | null, string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.value)
	}

	public static generateSyntheticChildren(props: TextFieldProps): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof TextField, SyntheticChildrenProvider>
