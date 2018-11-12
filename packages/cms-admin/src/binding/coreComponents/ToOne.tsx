import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName, Filter } from '../bindingTypes'
import { EntityAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface ToOneProps {
	field: FieldName
	reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	filter?: Filter
}

class ToOne extends React.PureComponent<ToOneProps> {
	static displayName = 'ToOne'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => (
					<DataContext.Consumer>
						{(data: DataContextValue) => {
							if (data instanceof EntityAccessor) {
								const transformer = new VariableInputTransformer(this.props.filter, environment)
								const field = data.data.getField(
									this.props.field,
									ReferenceMarker.ExpectedCount.UpToOne,
									transformer.transform(),
									this.props.reducedBy
								)

								if (field instanceof EntityAccessor) {
									return <ToOne.ToOneInner accessor={field}>{this.props.children}</ToOne.ToOneInner>
								}
							}
						}}
					</DataContext.Consumer>
				)}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateReferenceMarker(
		props: ToOneProps,
		fields: EntityFields,
		environment: Environment
	): ReferenceMarker {
		const transformer = new VariableInputTransformer(props.filter, environment)
		return new ReferenceMarker(
			props.field,
			ReferenceMarker.ExpectedCount.UpToOne,
			fields,
			transformer.transform(),
			props.reducedBy
		)
	}
}

namespace ToOne {
	export interface ToOneInnerProps {
		accessor: EntityAccessor
	}

	export class ToOneInner extends React.PureComponent<ToOneInnerProps> {
		public render() {
			return <DataContext.Provider value={this.props.accessor}>{this.props.children}</DataContext.Provider>
		}
	}
}

export { ToOne }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, ReferenceMarkerProvider>
