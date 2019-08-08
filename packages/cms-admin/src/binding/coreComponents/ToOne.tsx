import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FormErrors } from '../../components/ui/FormErrors'
import { FieldName, Filter, RelativeEntityList } from '../bindingTypes'
import { EntityAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { QueryLanguage } from '../queryLanguage'
import { DataContext } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { Props, ReferenceMarkerProvider, SyntheticChildrenProvider } from './MarkerProvider'

export interface ToOneProps {
	field: RelativeEntityList
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
			return (
				<AccessorRetriever
					field={this.props.field}
					filter={this.props.filter}
					reducedBy={this.props.reducedBy}
					environment={this.props.environment}
					renderer={AccessorRenderer}
				>
					{this.props.children}
				</AccessorRetriever>
			)
		}

		public static generateReferenceMarker(
			props: AtomicPrimitiveProps,
			fields: EntityFields,
			environment: Environment,
		): ReferenceMarker {
			return new ReferenceMarker(
				props.field,
				ReferenceMarker.ExpectedCount.UpToOne,
				fields,
				props.filter,
				props.reducedBy,
			)
		}
	}

	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof AtomicPrimitive, ReferenceMarkerProvider>

	export interface AccessorRetrieverProps extends AtomicPrimitiveProps {
		renderer: React.ComponentType<{
			accessor: EntityAccessor
		}>
	}

	export const AccessorRetriever = React.memo((props: React.PropsWithChildren<AccessorRetrieverProps>) => {
		const data = React.useContext(DataContext)

		return React.useMemo(() => {
			if (data instanceof EntityAccessor) {
				const fieldEntityAccessor = data.data.getField(
					props.field,
					ReferenceMarker.ExpectedCount.UpToOne,
					props.filter,
					props.reducedBy,
				)

				if (fieldEntityAccessor instanceof EntityAccessor) {
					const Renderer = props.renderer
					return <Renderer accessor={fieldEntityAccessor}>{props.children}</Renderer>
				}
			}
			return null
		}, [data, props])
	})

	export interface AccessorRendererProps {
		accessor: EntityAccessor
	}

	export class AccessorRenderer extends React.PureComponent<AccessorRendererProps> {
		public render() {
			return (
				<DataContext.Provider value={this.props.accessor}>
					<FormErrors errors={this.props.accessor.errors} />
					{this.props.children}
				</DataContext.Provider>
			)
		}
	}
}

export { ToOne }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, SyntheticChildrenProvider>
