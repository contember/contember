import * as React from 'react'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Field from '../coreComponents/Field'
import { SyntheticChildrenProvider } from '../coreComponents/MarkerProvider'
import Environment from '../dao/Environment'
import FieldAccessor from '../dao/FieldAccessor'
import Parser from '../queryLanguage/Parser'
import { TextFieldProps } from './fields/TextField'

interface FieldTextProps {
	name: string
}

export default class FieldText extends React.Component<FieldTextProps> {
	public static displayName = 'FieldText'

	public render() {
		return <Field name={this.props.name}>{(data: FieldAccessor) => data.currentValue}</Field>
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof FieldText, SyntheticChildrenProvider>
