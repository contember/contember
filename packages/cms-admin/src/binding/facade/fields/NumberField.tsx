import { FormGroup, IFormGroupProps, IInputGroupProps, InputGroup } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../../bindingTypes'
import EnforceSubtypeRelation from '../../coreComponents/EnforceSubtypeRelation'
import Field from '../../coreComponents/Field'
import { SyntheticChildrenProvider } from '../../coreComponents/MarkerProvider'
import Environment from '../../dao/Environment'
import FieldAccessor from '../../dao/FieldAccessor'
import Parser from '../../queryLanguage/Parser'

export interface TextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: IInputGroupProps['large']
	inlineLabel?: boolean
}

export default class TextField extends React.Component<TextFieldProps> {
	static displayName = 'TextField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<number | null, number>): React.ReactNode => (
					<FormGroup label={this.props.label} inline={this.props.inlineLabel}>
						<InputGroup
							value={data.currentValue ? data.currentValue.toFixed(0) : '0'}
							onChange={this.generateOnChange(data)}
							large={this.props.large}
							type="number"
						/>
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<number | null, number>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(parseInt(e.target.value, 10))
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof TextField, SyntheticChildrenProvider>
