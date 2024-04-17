import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { createUnionTextFilter } from '../../filterTypes'
import { DataViewFilter, DataViewFilterProps, DataViewLayout, DataViewLayoutProps, DataViewProps, DataViewQueryFilterName } from '../../components'
import { EntityListSubTreeMarker, Environment, FieldMarker, HasOneRelationMarker, MeaningfulMarker } from '@contember/binding'
import { EntityListSubTree, MarkerTreeGenerator } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { DataViewFilterHandler, DataViewSelectionLayout } from '../../types'

export interface DataViewStaticInfo {
	filterTypes: Record<string, DataViewFilterHandler<any>>
	layouts: DataViewSelectionLayout[]
}

export const collectStaticInfo = (props: DataViewProps, env: Environment): DataViewStaticInfo => {
	const [node, envWithSelectionState] = createDataViewReactNode(props, env)
	const filtersResult = dataViewAnalyzer.processChildren(node, envWithSelectionState)

	const layoutBoxes = filtersResult.filter((it): it is DataViewLayoutBox => it instanceof DataViewLayoutBox)
	const filterBoxes = filtersResult.filter((it): it is DataViewFilterBox => it instanceof DataViewFilterBox)

	const layouts = layoutBoxes.map(it => it.props)
	const filterTypes = getFilterTypes(props, env, filterBoxes)

	return { filterTypes, layouts }
}

const createDataViewReactNode = (props: DataViewProps, env: Environment) => {
	const selectionState = props.initialSelection && typeof props.initialSelection !== 'function' ? props.initialSelection : {}
	const envWithSelectionState = env.withExtension(dataViewSelectionEnvironmentExtension, selectionState)
	const entityListSubTree = <EntityListSubTree entities={props.entities}>{props.children}</EntityListSubTree>
	return [entityListSubTree, envWithSelectionState] as const
}


const getQueryField = (props: DataViewProps, env: Environment) => {
	if (props.queryField) {
		return props.queryField
	}
	const [node, envWithSelectionState] = createDataViewReactNode(props, env)
	const markerTreeGenerator = new MarkerTreeGenerator(node, envWithSelectionState)
	const markerTree = markerTreeGenerator.generate()
	const marker = Array.from(markerTree.subTrees.values())[0]
	if (!(marker instanceof EntityListSubTreeMarker)) {
		throw new Error()
	}
	return extractStringFields(marker)

}

const getFilterTypes = (props: DataViewProps, env: Environment, filterBoxes: DataViewFilterBox[]) => {

	const queryField = getQueryField(props, env)

	return {
		...(!queryField || (Array.isArray(queryField) && queryField.length === 0) ? {} : { [DataViewQueryFilterName]: createUnionTextFilter(queryField) }),
		...Object.fromEntries(filterBoxes.map(it => [it.props.name, it.props.filterHandler])),
		...props.filterTypes,
	}
}

class DataViewFilterBox {
	constructor(public readonly props: DataViewFilterProps) {
	}
}

class DataViewLayoutBox {
	constructor(public readonly props: DataViewLayoutProps) {
	}
}

const filterLeaf = new Leaf(node => new DataViewFilterBox(node.props), DataViewFilter)
const layoutLeaf = new Leaf(node => new DataViewLayoutBox(node.props), DataViewLayout)


export const dataViewAnalyzer = new ChildrenAnalyzer<
	DataViewFilterBox | DataViewLayoutBox,
	never,
	Environment
>([filterLeaf, layoutLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})


const extractStringFields = (marker: Exclude<MeaningfulMarker, FieldMarker>): string[] => {
	const node = marker.environment.getSubTreeNode()
	const textFields = []
	for (const field of marker.fields.markers.values()) {
		if (field instanceof FieldMarker) {
			const columnInfo = node.entity.fields.get(field.fieldName)
			if (columnInfo?.type === 'String') {
				textFields.push(field.fieldName)
			}
		} else if (field instanceof HasOneRelationMarker) {
			textFields.push(...extractStringFields(field).map(it => `${field.parameters.field}.${it}`))
		}
	}
	return textFields
}
