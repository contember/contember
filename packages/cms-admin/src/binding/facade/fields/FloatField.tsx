import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps, InputGroup, InputGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'

export interface FloatFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	large?: InputGroupProps['large']
}

export class FloatField extends React.PureComponent<FloatFieldProps> {
	static displayName = 'FloatField'

	public render() {
		return (
			<Field<number> name={this.props.name}>
				{({ data, environment }): React.ReactNode => (
					<FormGroup label={environment.applySystemMiddleware('labelMiddleware', this.props.label)}>
						<InputGroup
							value={typeof data.currentValue === 'number' ? data.currentValue.toString(10) : '0'}
							onChange={this.generateOnChange(data)}
							large={this.props.large}
							type="number"
						/>
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<number>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(parseFloat(e.target.value))
	}

	public static generateSyntheticChildren(props: FloatFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof FloatField,
	SyntheticChildrenProvider<FloatFieldProps>
>
