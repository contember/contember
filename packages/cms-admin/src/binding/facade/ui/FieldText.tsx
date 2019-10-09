import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { Scalar } from '../../accessorTree'
import { QueryLanguage } from '../../queryLanguage'

interface FieldTextProps<AcceptableValue extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal> {
	name: string
	format?: (value: AcceptableValue | null) => React.ReactNode
}

export class FieldText<
	AcceptableValue extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal
> extends React.PureComponent<FieldTextProps<AcceptableValue>> {
	public static displayName = 'FieldText'

	public render() {
		return (
			<Field<AcceptableValue> name={this.props.name}>
				{({ data }) => (this.props.format ? this.props.format(data.currentValue) : data.currentValue)}
			</Field>
		)
	}

	public static generateSyntheticChildren(props: FieldTextProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof FieldText,
	SyntheticChildrenProvider<FieldTextProps>
>
