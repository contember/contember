import {
	AccessorTreeStateName,
	BindingError,
	DataBindingProvider,
	DataBindingStateComponentProps,
	EntityListSubTree,
	Field,
	QueryLanguage,
	SugaredQualifiedFieldList,
	useEnvironment,
} from '@contember/binding'
import { Spinner } from '@contember/ui'
import * as React from 'react'
import { DimensionsRenderer, DimensionsRendererProps } from './DimensionsRenderer'

export interface DimensionsSwitcherBaseProps
	extends Omit<DimensionsRendererProps, 'labelFactory' | 'minItems' | 'maxItems' | 'redirect'>,
		Omit<SugaredQualifiedFieldList, 'fields'> {
	optionEntities: SugaredQualifiedFieldList['fields']
	minItems?: number
	maxItems?: number
	labelField: string
}

export interface DimensionsSwitcherProps extends DimensionsSwitcherBaseProps {}

const DimensionsStateRenderer = (props: DataBindingStateComponentProps) => {
	if (props.accessorTreeState.name === AccessorTreeStateName.Interactive) {
		return <>{props.children}</>
	}
	return <Spinner />
}

export const DimensionsSwitcher = React.memo((props: DimensionsSwitcherProps) => {
	const minItems = props.minItems === undefined ? 1 : props.minItems
	const maxItems = props.maxItems === undefined ? 2 : props.maxItems

	if (minItems > maxItems) {
		throw new BindingError(
			`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be no greater than 'maxItems'.`,
		)
	}
	if (minItems < 1) {
		throw new BindingError(`DimensionSwitcher: 'minItems' for dimension ${props.dimension} must be at least 1.`)
	}

	const environment = useEnvironment()
	const qualifiedEntityList = QueryLanguage.desugarQualifiedEntityList(
		{
			...props,
			entities: props.optionEntities,
		},
		environment,
	)
	const labelFactory = <Field field={props.labelField} />

	return (
		<DataBindingProvider stateComponent={DimensionsStateRenderer}>
			<EntityListSubTree
				entities={qualifiedEntityList}
				orderBy={qualifiedEntityList.orderBy}
				offset={qualifiedEntityList.offset}
				limit={qualifiedEntityList.limit}
				listComponent={DimensionsRenderer}
				listProps={{
					buttonProps: props.buttonProps,
					dimension: props.dimension,
					labelFactory: labelFactory,
					minItems: minItems,
					maxItems: maxItems,
					renderSelected: props.renderSelected,
					slugField: props.slugField,
				}}
			/>
		</DataBindingProvider>
	)
})

DimensionsSwitcher.displayName = 'DimensionsSwitcher'
