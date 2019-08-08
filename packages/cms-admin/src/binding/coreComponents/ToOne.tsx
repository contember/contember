import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FormErrors } from '../../components/ui/FormErrors'
import { FieldName, Filter, RelativeEntityList } from '../bindingTypes'
import { EntityAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { Component } from '../facade/auxiliary'
import { QueryLanguage } from '../queryLanguage'
import { DataContext, useEntityAccessor } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { SyntheticChildrenProvider } from './MarkerProvider'

export interface ToOneProps {
	field: RelativeEntityList
	children?: React.ReactNode
}

class ToOne extends React.PureComponent<ToOneProps> {
	static displayName = 'ToOne'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => ToOne.generateSyntheticChildren(this.props, environment)}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: ToOneProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleEntity(props.field, props.children, environment)
	}
}

namespace ToOne {
	export interface AtomicPrimitiveProps {
		field: FieldName
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
		filter?: Filter
		children?: React.ReactNode
	}

	export const AtomicPrimitive = Component<AtomicPrimitiveProps>(
		props => {
			const accessor = useEntityAccessor(props)

			if (!accessor) {
				return null
			}
			return <AccessorRenderer accessor={accessor}>{props.children}</AccessorRenderer>
		},
		{
			generateReferenceMarker(props: AtomicPrimitiveProps, fields: EntityFields): ReferenceMarker {
				return new ReferenceMarker(
					props.field,
					ReferenceMarker.ExpectedCount.UpToOne,
					fields,
					props.filter,
					props.reducedBy,
				)
			},
		},
		'ToOne.AtomicPrimitive',
	)

	export interface AccessorRendererProps {
		accessor: EntityAccessor
		children?: React.ReactNode
	}

	export const AccessorRenderer = React.memo((props: AccessorRendererProps) => (
		<DataContext.Provider value={props.accessor}>
			<FormErrors errors={props.accessor.errors} />
			{props.children}
		</DataContext.Provider>
	))

	// AccessorRetriever is really legacy API to retain support for class components
	export interface AccessorRetrieverProps extends AtomicPrimitiveProps {
		children: (accessor: EntityAccessor) => React.ReactNode
	}

	export const AccessorRetriever = React.memo((props: React.PropsWithChildren<AccessorRetrieverProps>) => {
		const accessor = useEntityAccessor(props)

		if (!accessor) {
			return null
		}

		return <>{props.children(accessor)}</>
	})
	AccessorRetriever.displayName = 'ToOne.AccessorRetriever'
}

export { ToOne }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, SyntheticChildrenProvider>
