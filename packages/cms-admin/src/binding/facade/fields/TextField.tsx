// import {  } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps, InputGroup, InputGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'

export interface TextFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	large?: InputGroupProps['large']
	inlineLabel?: boolean
}

export class TextField extends React.PureComponent<TextFieldProps> {
	static displayName = 'TextField'

	public render() {
		return (
			<Field<string> name={this.props.name}>
				{({ data, isMutating, environment }): React.ReactNode => (
					<FormGroup label={environment.applySystemMiddleware('labelMiddleware', this.props.label)}>
						<InputGroup
							value={data.currentValue || ''}
							onChange={this.generateOnChange(data)}
							large={this.props.large}
							readOnly={isMutating}
						/>
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.value)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof TextField,
	SyntheticChildrenProvider<TextFieldProps>
>
