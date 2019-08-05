import * as React from 'react'
import {
	DataBindingError,
	EntityListDataProvider,
	EntityListDataProviderProps,
	Environment,
	Field,
	FieldText
} from '../../../index'
import { QueryLanguage } from '../../../queryLanguage'
import { DimensionsRenderer, DimensionsRendererProps } from './DimensionsRenderer'

export interface DimensionsSwitcherBaseProps
	extends Omit<DimensionsRendererProps, 'labelFactory' | 'minItems' | 'maxItems'> {
	optionEntities: string
	minItems?: number
	maxItems?: number
	labelField: string
	orderBy?: EntityListDataProviderProps<unknown>['orderBy']
}

export interface DimensionsSwitcherProps extends DimensionsSwitcherBaseProps {
	children?: DimensionsRendererProps['labelFactory']
}

export const DimensionsSwitcher: React.FunctionComponent<DimensionsSwitcherProps> = props => {
	const minItems = props.minItems === undefined ? 1 : props.minItems
	const maxItems = props.maxItems === undefined ? 2 : props.maxItems

	if (minItems > maxItems) {
		throw new DataBindingError(
			`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be no greater than 'maxItems'.`
		)
	}
	if (minItems < 1) {
		throw new DataBindingError(`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be at least 1.`)
	}
	if (props.defaultValue.length < minItems || props.defaultValue.length > maxItems) {
		throw new DataBindingError(
			`DimensionSwitcher: the number of default values for dimension ${props.dimension} must not be between` +
				`'minItems' and 'maxItems'.`
		)
	}

	const environment = new Environment()
	const metadata = QueryLanguage.wrapQualifiedEntityList(
		props.optionEntities,
		<>
			{props.children || <FieldText name={props.labelField} />}
			<Field name={props.slugField} />
		</>,
		environment
	)

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
				minItems: minItems,
				maxItems: maxItems,
				renderSelected: props.renderSelected,
				slugField: props.slugField
			}}
		>
			{metadata.children}
		</EntityListDataProvider>
	)
}

DimensionsSwitcher.displayName = 'DimensionsSwitcher'
