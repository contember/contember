import * as React from 'react'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { TextFieldProps } from '../fields'

interface FieldTextProps {
	name: string
	formatter?: (value: string | null) => React.ReactNode
}

export class FieldText extends React.PureComponent<FieldTextProps> {
	public static displayName = 'FieldText'

	public render() {
		return (
			<Field<string> name={this.props.name}>
				{({ data }) => (this.props.formatter ? this.props.formatter(data.currentValue) : data.currentValue)}
			</Field>
		)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof FieldText,
	SyntheticChildrenProvider<FieldTextProps>
>
