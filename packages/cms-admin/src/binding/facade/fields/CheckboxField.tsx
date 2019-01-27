import { Checkbox, FormGroup, IFormGroupProps, IInputGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { Parser } from '../../queryLanguage'

export interface CheckboxFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: IInputGroupProps['large']
	inlineLabel?: boolean
}

export class CheckboxField extends React.PureComponent<CheckboxFieldProps> {
	static displayName = 'CheckboxField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<boolean>, env): React.ReactNode => (
					<FormGroup
						label={env.applySystemMiddleware('labelMiddleware', this.props.label)}
						inline={this.props.inlineLabel}
					>
						<Checkbox checked={!!data.currentValue} onChange={this.generateOnChange(data)} large={this.props.large} />
					</FormGroup>
				)}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<boolean>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.checked)
	}

	public static generateSyntheticChildren(props: CheckboxFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedNode(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof CheckboxField,
	SyntheticChildrenProvider<CheckboxFieldProps>
>
