import * as React from 'react'
import {
	BindingError,
	Environment,
	EnvironmentContext,
	EnvironmentDeltaProvider,
	HasOne,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SyntheticChildrenProvider,
} from '@contember/binding'

type EnforceSubtypeRelation<Sub extends Super, Super> = never

export interface SideDimensionsProps extends SideDimensions.CommonDimensionProps {
	dimension?: string
	staticOptions?: Array<Environment.Value>
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
		if ((props.dimension === undefined) === (props.staticOptions === undefined)) {
			throw new BindingError(
				`The SideDimensions component needs to be passed exactly one of its 'dimension' or 'staticOptions' props.`,
			)
		}

		let dimensions: Array<Environment.Value>

		if (props.dimension !== undefined) {
			const selectedDimensions = environment.getAllDimensions()

			if (!(props.dimension in selectedDimensions)) {
				console.error(new BindingError(`The '${props.dimension}' dimension in undefined`))
				return
			}

			dimensions = selectedDimensions[props.dimension]
		} else if (props.staticOptions !== undefined) {
			dimensions = props.staticOptions
		}

		const alignChildren: boolean = props.alignChildren !== false
		const children: React.ReactNodeArray =
			Array.isArray(props.children) && alignChildren ? props.children : [props.children]

		return (
			<div className="sideDimensions-dimensions">
				{children.map((child, i) => (
					<div className="sideDimensions-dimensions-in" key={i}>
						{dimensions.map((item, j) => {
							return (
								<SideDimensions.SingleDimension
									environment={environment}
									dimensionValue={item}
									variableName={props.variableName}
									variables={props.variables}
									hasOneField={props.hasOneField}
									key={j}
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
		hasOneField?: string | SugaredRelativeSingleEntity
		variableName?: Environment.Name
		variables?: Environment.DeltaFactory | ((dimensionValue: Environment.Value) => Environment.DeltaFactory)
	}

	export interface SingleDimensionProps extends CommonDimensionProps {
		children: React.ReactNode
		environment: Environment
		dimensionValue: Environment.Value
	}

	export class SingleDimension extends React.PureComponent<SingleDimensionProps> {
		static displayName = 'SideDimension'

		public render() {
			const children = SingleDimension.generateSyntheticChildren(this.props, this.props.environment)
			return (
				<EnvironmentContext.Provider value={SingleDimension.generateEnvironment(this.props, this.props.environment)}>
					<div className="sideDimensions-dimensions-dimension">{children}</div>
				</EnvironmentContext.Provider>
			)
		}

		public static generateSyntheticChildren(props: SingleDimensionProps, environment: Environment): React.ReactNode {
			if (!props.hasOneField) {
				return props.children
			}
			const hasOneProps: SugaredRelativeSingleEntity =
				typeof props.hasOneField === 'string'
					? {
							field: props.hasOneField,
					  }
					: props.hasOneField
			return <HasOne {...hasOneProps}>{props.children}</HasOne>
		}

		public static generateEnvironment(props: SingleDimensionProps, oldEnvironment: Environment): Environment {
			if (!props.variables) {
				return oldEnvironment
			}

			let deltaFactory: Environment.DeltaFactory

			if (typeof props.variables === 'function') {
				deltaFactory = props.variables(props.dimensionValue)
			} else if (props.variables) {
				deltaFactory = props.variables
			} else {
				deltaFactory = {}
			}

			if (props.variableName) {
				oldEnvironment = oldEnvironment.putName(props.variableName, props.dimensionValue)
				deltaFactory[props.variableName] = props.dimensionValue
			}

			return oldEnvironment.putDelta(Environment.generateDelta(oldEnvironment, deltaFactory))
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
