import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'

export interface CheckboxFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	defaultValue?: boolean
}

export class CheckboxField extends React.PureComponent<CheckboxFieldProps> {
	static displayName = 'CheckboxField'

	public render() {
		return (
			<Field<boolean> name={this.props.name}>
				{({ data, environment }): React.ReactNode => (
					<FormGroup label={environment.applySystemMiddleware('labelMiddleware', this.props.label)}>
						<input type="checkbox" checked={!!data.currentValue} onChange={this.generateOnChange(data)} />
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<boolean>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.checked)
	}

	public static generateSyntheticChildren(props: CheckboxFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(
			props.name,
			fieldName => <Field name={fieldName} defaultValue={props.defaultValue || false} />,
			environment
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof CheckboxField,
	SyntheticChildrenProvider<CheckboxFieldProps>
>
