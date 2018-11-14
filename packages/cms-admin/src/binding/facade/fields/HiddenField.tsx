import * as React from 'react'
import { EnforceSubtypeRelation, Field, FieldPublicProps, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { Parser } from '../../queryLanguage'

export interface HiddenFieldProps extends FieldPublicProps {
	defaultValue: FieldPublicProps['defaultValue']
}

export class HiddenField extends React.PureComponent<HiddenFieldProps> {
	static displayName = 'HiddenField'

	public render() {
		return null
	}

	public static generateSyntheticChildren(props: HiddenFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedNode(props.name, fieldName => <Field {...props} name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof HiddenField,
	SyntheticChildrenProvider<HiddenFieldProps>
>
