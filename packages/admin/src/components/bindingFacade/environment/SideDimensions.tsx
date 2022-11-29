import {
	BindingError,
	Environment,
	EnvironmentContext,
	EnvironmentDeltaProvider,
	HasOne,
	StaticRenderProvider,
	SugaredRelativeSingleEntity,
} from '@contember/binding'
import { PureComponent, ReactElement, ReactNode, ReactNodeArray } from 'react'
import { LabelMiddleware, LabelMiddlewareProvider } from './LabelMiddleware'

type EnforceSubtypeRelation<Sub extends Super, Super> = never

export interface SideDimensionsProps extends SideDimensions.CommonDimensionProps {
	dimension?: string
	staticOptions?: Array<Environment.Value>
	children: ReactNode
	alignChildren?: boolean
}

class SideDimensions extends PureComponent<SideDimensionsProps> {
	static displayName = 'SideDimensions'

	public override render() {
		return (
			<div className="sideDimensions">
				<EnvironmentContext.Consumer>
					{oldEnvironment => SideDimensions.staticRender(this.props, oldEnvironment)}
				</EnvironmentContext.Consumer>
			</div>
		)
	}

	public static staticRender(props: SideDimensionsProps, environment: Environment): ReactElement | null {
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
				return null
			}

			dimensions = selectedDimensions[props.dimension]
		} else if (props.staticOptions !== undefined) {
			dimensions = props.staticOptions
		}

		const alignChildren: boolean = props.alignChildren !== false
		const children: ReactNodeArray = Array.isArray(props.children) && alignChildren ? props.children : [props.children]

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
									renderDimensionValue={dimensions.length > 1}
									labelMiddleware={props.labelMiddleware}
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
	type ValuesMapWithLegacyLabelMiddleware = Environment.ValuesMapWithFactory & { labelMiddleware?: LabelMiddleware}

	export interface CommonDimensionProps {
		hasOneField?: string | SugaredRelativeSingleEntity
		variableName?: Environment.Name
		variables?: ValuesMapWithLegacyLabelMiddleware | ((dimensionValue: Environment.Value) => ValuesMapWithLegacyLabelMiddleware)
		labelMiddleware?: LabelMiddleware
	}

	export interface SingleDimensionProps extends CommonDimensionProps {
		children: ReactNode
		environment: Environment
		dimensionValue: Environment.Value
		renderDimensionValue: boolean
	}

	export class SingleDimension extends PureComponent<SingleDimensionProps> {
		static displayName = 'SideDimension'

		public override render() {
			const children = SingleDimension.staticRender(this.props, this.props.environment)
			const newLabelMiddleware = this.getLabelMiddleware()
			const inner = (
				<EnvironmentContext.Provider value={SingleDimension.generateEnvironment(this.props, this.props.environment)}>
					<div className="sideDimensions-dimensions-dimension">
						{this.props.renderDimensionValue && <span className="sideDimensions-dimensions-dimensionValue">{this.props.dimensionValue as string}</span>}
						{children}
					</div>
				</EnvironmentContext.Provider>
			)
			if (newLabelMiddleware) {
				return (
					<LabelMiddlewareProvider value={newLabelMiddleware}>
						{inner}
					</LabelMiddlewareProvider>
				)
			}
			return inner
		}

		public getLabelMiddleware(): LabelMiddleware | undefined {
			if (this.props.labelMiddleware) {
				return this.props.labelMiddleware
			}
			if (!this.props.variables) {
				return undefined
			}
			const variables = typeof this.props.variables === 'function' ? this.props.variables(this.props.dimensionValue) : this.props.variables
			if ('labelMiddleware' in variables) {
				return variables.labelMiddleware
			}
			return undefined
		}

		public static staticRender(props: SingleDimensionProps, environment: Environment): ReactNode {
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
			const deltaFactory: ValuesMapWithLegacyLabelMiddleware = typeof props.variables === 'function'
				? props.variables(props.dimensionValue)
				: props.variables ?? {}

			if (props.variableName) {
				deltaFactory[props.variableName] = props.dimensionValue
			}

			const { labelMiddleware, ...variables } = deltaFactory
			return oldEnvironment.withVariables(variables)
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
	StaticRenderProvider<SideDimensionsProps>
>
