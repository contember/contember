import {
	BindingError,
	DataBindingProvider,
	DataBindingStateComponentProps,
	EntityListSubTree,
	Field,
	QueryLanguage,
	SugaredQualifiedFieldList,
	useEnvironment,
} from '@contember/react-binding'
import { Spinner } from '@contember/ui'
import { memo, useMemo } from 'react'
import { DimensionsRenderer, DimensionsRendererProps } from './DimensionsRenderer'

export interface DimensionsSwitcherBaseProps
	extends Omit<DimensionsRendererProps, 'accessor' | 'labelFactory' | 'minItems' | 'maxItems' | 'redirect'> {
	orderBy?: SugaredQualifiedFieldList['orderBy']
	optionEntities: SugaredQualifiedFieldList['fields']
	minItems?: number
	maxItems?: number
	labelField: string
}

export interface DimensionsSwitcherProps extends DimensionsSwitcherBaseProps {}

const DimensionsStateRenderer = (props: DataBindingStateComponentProps) => {
	if (props.accessorTreeState.name === 'initialized') {
		return <>{props.children}</>
	}
	return <Spinner />
}

/**
 * @group Dimensions
 */
export const DimensionsSwitcher = memo((props: DimensionsSwitcherProps) => {
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
			orderBy: props.orderBy,
			entities: props.optionEntities,
		},
		environment,
	)
	const key = useMemo(() => JSON.stringify(qualifiedEntityList), [qualifiedEntityList])
	const labelFactory = <Field field={props.labelField} />

	return (
		<DataBindingProvider stateComponent={DimensionsStateRenderer} key={key}>
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
			>
				{labelFactory}
				<Field field={props.slugField} />
			</EntityListSubTree>
		</DataBindingProvider>
	)
})

DimensionsSwitcher.displayName = 'DimensionsSwitcher'
