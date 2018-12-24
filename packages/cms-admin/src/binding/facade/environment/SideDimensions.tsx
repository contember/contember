import * as React from 'react'
import {
	EnforceSubtypeRelation,
	EnvironmentContext,
	EnvironmentDeltaProvider,
	SyntheticChildrenProvider
} from '../../coreComponents'
import { DataBindingError, Environment } from '../../dao'

interface SideDimensionsProps extends SideDimensions.CommonDimensionProps {
	dimension: string
	children: React.ReactNode
	alignChildren?: boolean
}

class SideDimensions extends React.PureComponent<SideDimensionsProps> {
	static displayName = 'SideDimensions'

	public render() {
		return (
			<div className="sideDimensions">
				<EnvironmentContext.Consumer>
					{oldEnvironment => SideDimensions.generateSyntheticChildren(this.props, oldEnvironment)}
				</EnvironmentContext.Consumer>
			</div>
		)
	}

	public static generateSyntheticChildren(props: SideDimensionsProps, environment: Environment): React.ReactNode {
		const dimensions = environment.getDimensions()

		if (!(props.dimension in dimensions)) {
			throw new DataBindingError(`The '${props.dimension}' dimension in undefined`)
		}

		const alignChildren: boolean = props.alignChildren !== false
		const children: React.ReactNodeArray =
			Array.isArray(props.children) && alignChildren ? props.children : [props.children]

		return (
			<div className="sideDimensions-dimensions">
				{children.map((child, i) => (
					<div className="sideDimensions-dimensions-in" key={i}>
						{dimensions[props.dimension].map(item => {
							return (
								<SideDimensions.SingleDimension
									dimensionValue={item}
									variableName={props.variableName}
									variables={props.variables}
									key={item}
								>
									{child}
								</SideDimensions.SingleDimension>
							)
						})}
					</div>
				))}
			</div>
		)
	}
}

namespace SideDimensions {
	export interface CommonDimensionProps {
		variableName: Environment.Name
		variables?: Environment.DeltaFactory
	}

	export interface SingleDimensionProps extends CommonDimensionProps {
		dimensionValue: Environment.Value
	}

	export class SingleDimension extends React.PureComponent<SingleDimensionProps> {
		static displayName = 'SideDimension'

		public render() {
			return (
				<EnvironmentContext.Consumer>
					{oldEnvironment => (
						<EnvironmentContext.Provider
							value={oldEnvironment.putDelta(SingleDimension.generateEnvironmentDelta(this.props, oldEnvironment))}
						>
							<div className="sideDimensions-dimensions-dimension">{this.props.children}</div>
						</EnvironmentContext.Provider>
					)}
				</EnvironmentContext.Consumer>
			)
		}

		public static generateEnvironmentDelta(
			props: SingleDimensionProps,
			oldEnvironment: Environment
		): Partial<Environment.NameStore> {
			if (!props.variables) {
				return {}
			}
			return Environment.generateDelta(oldEnvironment.putName(props.variableName, props.dimensionValue), {
				...props.variables,
				[props.variableName]: props.dimensionValue
			})
		}
	}

	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
		typeof SingleDimension,
		EnvironmentDeltaProvider<SingleDimensionProps>
	>
}

export { SideDimensions }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SideDimensions,
	SyntheticChildrenProvider<SideDimensionsProps>
>
