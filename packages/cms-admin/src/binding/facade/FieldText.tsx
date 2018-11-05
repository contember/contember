import * as React from 'react'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../coreComponents'
import { Environment, FieldAccessor } from '../dao'
import { Parser } from '../queryLanguage'
import { TextFieldProps } from './fields'

interface FieldTextProps {
	name: string
}

export class FieldText extends React.Component<FieldTextProps> {
	public static displayName = 'FieldText'

	public render() {
		return <Field name={this.props.name}>{(data: FieldAccessor) => data.currentValue}</Field>
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof FieldText, SyntheticChildrenProvider>
