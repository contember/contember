import { FormGroup, IFormGroupProps, IInputGroupProps, InputGroup } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { Parser, QueryLanguage } from '../../queryLanguage'

export interface FloatFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: IInputGroupProps['large']
	inlineLabel?: boolean
}

export class FloatField extends React.PureComponent<FloatFieldProps> {
	static displayName = 'FloatField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<number>, env): React.ReactNode => (
					<FormGroup
						label={env.applySystemMiddleware('labelMiddleware', this.props.label)}
						inline={this.props.inlineLabel}
					>
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
