import * as React from 'react'
import {
	DataBindingError,
	EntityListDataProvider,
	EntityListDataProviderProps,
	EnvironmentContext,
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

export const DimensionsSwitcher: React.FunctionComponent<DimensionsSwitcherProps> = props => {
	if (props.minItems > props.maxItems) {
		throw new DataBindingError(
			`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be no greater than 'maxItems'.`
		)
	}
	if (props.minItems < 1) {
		throw new DataBindingError(`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be at least 1.`)
	}
	if (props.defaultValue.length < props.minItems || props.defaultValue.length > props.maxItems) {
		throw new DataBindingError(
			`DimensionSwitcher: the number of default values for dimension ${props.dimension} must not be between` +
				`'minItems' and 'maxItems'.`
		)
	}

	const environment = React.useContext(EnvironmentContext)
	const children = props.children
	const metadata: QueryLanguage.WrappedQualifiedEntityList | QueryLanguage.WrappedQualifiedFieldList = children
		? QueryLanguage.wrapQualifiedEntityList(props.options, children, environment)
		: QueryLanguage.wrapQualifiedFieldList(props.options, fieldName => <FieldText name={fieldName} />, environment)

	return (
		<EntityListDataProvider<DimensionsRendererProps>
			entityName={metadata.entityName}
			immutable={true}
			orderBy={props.orderBy}
			renderer={DimensionsRenderer}
			rendererProps={{
				buttonProps: props.buttonProps,
				defaultValue: props.defaultValue,
				dimension: props.dimension,
				labelFactory: metadata.children,
				minItems: props.minItems,
				maxItems: props.maxItems,
				renderSelected: props.renderSelected,
				slugField: props.slugField
			}}
		>
			{metadata.children}
			<FieldText name={props.slugField} />
		</EntityListDataProvider>
	)
}

DimensionsSwitcher.displayName = 'DimensionsSwitcher'

DimensionsSwitcher.defaultProps = {
	minItems: 1,
	maxItems: 2
}
