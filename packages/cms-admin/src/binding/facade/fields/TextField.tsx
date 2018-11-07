import { FormGroup, IFormGroupProps, IInputGroupProps, InputGroup } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { Parser } from '../../queryLanguage'

export interface TextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: IInputGroupProps['large']
	inlineLabel?: boolean
}

export class TextField extends React.Component<TextFieldProps> {
	static displayName = 'TextField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<string | null, string>, env): React.ReactNode => (
					<FormGroup
						label={env.applySystemMiddleware('labelMiddleware', this.props.label)}
						inline={this.props.inlineLabel}
					>
						<InputGroup
							value={data.currentValue || ''}
							onChange={this.generateOnChange(data)}
							large={this.props.large}
						/>
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string | null, string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.value)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof TextField, SyntheticChildrenProvider>
