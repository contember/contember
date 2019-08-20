import * as React from 'react'
import { useRedirect } from '../../../../components/pageRouting'
import {
	DataBindingError,
	EntityListDataProvider,
	EntityListDataProviderProps,
	Environment,
	Field,
	FieldText,
} from '../../../index'
import { QueryLanguage } from '../../../queryLanguage'
import { DimensionsRenderer, DimensionsRendererProps } from './DimensionsRenderer'

export interface DimensionsSwitcherBaseProps
	extends Omit<DimensionsRendererProps, 'labelFactory' | 'minItems' | 'maxItems' | 'redirect'> {
	optionEntities: string
	minItems?: number
	maxItems?: number
	labelField: string
	orderBy?: EntityListDataProviderProps<unknown>['orderBy']
}

export interface DimensionsSwitcherProps extends DimensionsSwitcherBaseProps {
	children?: DimensionsRendererProps['labelFactory']
}

export const DimensionsSwitcher = React.memo((props: DimensionsSwitcherProps) => {
	const minItems = props.minItems === undefined ? 1 : props.minItems
	const maxItems = props.maxItems === undefined ? 2 : props.maxItems

	if (minItems > maxItems) {
		throw new DataBindingError(
			`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be no greater than 'maxItems'.`,
		)
	}
	if (minItems < 1) {
		throw new DataBindingError(`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be at least 1.`)
	}

	const environment = new Environment()
	const metadata = QueryLanguage.wrapQualifiedEntityList(
		props.optionEntities,
		<>
			{props.children || <FieldText name={props.labelField} />}
			<Field name={props.slugField} />
		</>,
		environment,
	)

	return (
		<EntityListDataProvider<DimensionsRendererProps>
			entityName={metadata.entityName}
			immutable={true}
			orderBy={props.orderBy}
			renderer={DimensionsRenderer}
			rendererProps={{
				buttonProps: props.buttonProps,
				dimension: props.dimension,
				labelFactory: metadata.children,
				minItems: minItems,
				maxItems: maxItems,
				renderSelected: props.renderSelected,
				slugField: props.slugField,
			}}
		>
			{metadata.children}
		</EntityListDataProvider>
	)
})

DimensionsSwitcher.displayName = 'DimensionsSwitcher'
