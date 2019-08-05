import * as React from 'react'
import {
	DataBindingError,
	EntityListDataProvider,
	EntityListDataProviderProps,
	Environment,
	FieldText
} from '../../../index'
import { QueryLanguage } from '../../../queryLanguage'
import { DimensionsRenderer, DimensionsRendererProps } from './DimensionsRenderer'

export interface DimensionsSwitcherBaseProps extends Omit<DimensionsRendererProps, 'labelFactory'> {
	options: string
	orderBy?: EntityListDataProviderProps<unknown>['orderBy']
}

export interface DimensionsSwitcherProps extends DimensionsSwitcherBaseProps {
	children?: DimensionsRendererProps['labelFactory']
}

export class DimensionsSwitcher extends React.PureComponent<DimensionsSwitcherProps> {
	public static displayName = 'DimensionsSwitcher'
	public static defaultProps: Partial<DimensionsSwitcherProps> = {
		minItems: 1,
		maxItems: 2
	}

	public render() {
		this.validateProps()

		const environment = new Environment()
		const children = this.props.children
		const metadata: QueryLanguage.WrappedQualifiedEntityList | QueryLanguage.WrappedQualifiedFieldList = children
			? QueryLanguage.wrapQualifiedEntityList(this.props.options, children, environment)
			: QueryLanguage.wrapQualifiedFieldList(
					this.props.options,
					fieldName => <FieldText name={fieldName} />,
					environment
			  )

		return (
			<EntityListDataProvider<DimensionsRendererProps>
				entityName={metadata.entityName}
				immutable={true}
				orderBy={this.props.orderBy}
				renderer={DimensionsRenderer}
				rendererProps={{
					buttonProps: this.props.buttonProps,
					defaultValue: this.props.defaultValue,
					dimension: this.props.dimension,
					labelFactory: metadata.children,
					minItems: this.props.minItems,
					maxItems: this.props.maxItems,
					renderSelected: this.props.renderSelected,
					slugField: this.props.slugField
				}}
			>
				{metadata.children}
				<FieldText name={this.props.slugField} />
			</EntityListDataProvider>
		)
	}

	private validateProps() {
		if (this.props.minItems > this.props.maxItems) {
			throw new DataBindingError(
				`DimensionSwitcher: 'minItems' for dimension ${this.props.dimension} must be no greater than 'maxItems'.`
			)
		}
		if (this.props.minItems < 1) {
			throw new DataBindingError(
				`DimensionSwitcher: 'minItems' for dimension ${this.props.dimension} must be at least 1.`
			)
		}
		if (this.props.defaultValue.length < this.props.minItems || this.props.defaultValue.length > this.props.maxItems) {
			throw new DataBindingError(
				`DimensionSwitcher: the number of default values for dimension ${this.props.dimension} must not be between` +
					`'minItems' and 'maxItems'.`
			)
		}
	}
}
