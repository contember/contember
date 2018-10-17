import * as React from 'react'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import EnvironmentContext from '../coreComponents/EnvironmentContext'
import { EnvironmentDeltaProvider, SyntheticChildrenProvider } from '../coreComponents/MarkerProvider'
import DataBindingError from '../dao/DataBindingError'
import Environment from '../dao/Environment'

interface SideDimensionsProps extends SideDimensions.CommonDimensionProps {
	dimension: string
	children: React.ReactNode
}

class SideDimensions extends React.Component<SideDimensionsProps> {
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

		return (
			<div className="sideDimensions-dimensions">
				{dimensions[props.dimension].map(item => {
					return (
						<SideDimensions.SingleDimension
							dimensionValue={item}
							variableName={props.variableName}
							variables={props.variables}
							key={item}
						>
							{props.children}
						</SideDimensions.SingleDimension>
					)
				})}
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

	export class SingleDimension extends React.Component<SingleDimensionProps> {
		static displayName = 'SideDimension'

		public render() {
			return (
				<EnvironmentContext.Consumer>
					{oldEnvironment => (
						<EnvironmentContext.Provider
							value={oldEnvironment.putDelta(SingleDimension.generateEnvironmentDelta(this.props, oldEnvironment))}
						>
							<div className="sideDimensions-dimensions-dimension">
								{this.props.children}
							</div>
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
			return Environment.generateDelta(
				oldEnvironment.putName(props.variableName, props.dimensionValue),
				props.variables
			)
		}
	}

	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SingleDimension, EnvironmentDeltaProvider>
}

export default SideDimensions

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SideDimensions, SyntheticChildrenProvider>
