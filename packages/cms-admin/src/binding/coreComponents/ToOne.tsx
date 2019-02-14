import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName, Filter, RelativeEntityList } from '../bindingTypes'
import { EntityAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { QueryLanguage } from '../queryLanguage'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { Props, ReferenceMarkerProvider, SyntheticChildrenProvider } from './MarkerProvider'

export interface ToOneProps {
	field: RelativeEntityList
}

class ToOne extends React.PureComponent<ToOneProps> {
	static displayName = 'ToOne'

	public render() {
		return <EnvironmentContext.Consumer>
			{(environment: Environment) => (
				ToOne.generateSyntheticChildren(this.props, environment)
			)}
		</EnvironmentContext.Consumer>
	}

	public static generateSyntheticChildren(props: Props<ToOneProps>, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleEntity(props.field, props.children, environment)
	}
}

namespace ToOne {
	export interface AtomicPrimitivePublicProps {
		field: FieldName
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
		filter?: Filter
	}

	interface AtomicPrimitiveProps extends AtomicPrimitivePublicProps {
		environment: Environment
	}

	export class AtomicPrimitive extends React.PureComponent<AtomicPrimitiveProps> {
		static displayName = 'ToOne.AtomicPrimitive'

		public render() {
			return <DataContext.Consumer>
				{(data: DataContextValue) => {
				if (data instanceof EntityAccessor) {
					const field = data.data.getField(
						this.props.field,
						ReferenceMarker.ExpectedCount.UpToOne,
						VariableInputTransformer.transformFilter(this.props.filter, this.props.environment),
						this.props.reducedBy
					)

					if (field instanceof EntityAccessor) {
						return <ToOne.ToOneInner accessor={field}>{this.props.children}</ToOne.ToOneInner>
					}
				}
			}}
		</DataContext.Consumer>
		}

		public static generateReferenceMarker(
			props: AtomicPrimitiveProps,
			fields: EntityFields,
			environment: Environment
		): ReferenceMarker {
			return new ReferenceMarker(
				props.field,
				ReferenceMarker.ExpectedCount.UpToOne,
				fields,
				VariableInputTransformer.transformFilter(props.filter, environment),
				props.reducedBy
			)
		}
	}

	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof AtomicPrimitive, ReferenceMarkerProvider>

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

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, SyntheticChildrenProvider>
