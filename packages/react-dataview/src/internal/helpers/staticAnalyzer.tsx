import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { createUnionTextFilter } from '../../filterTypes'
import { DataViewFilter, DataViewFilterProps, DataViewLayout, DataViewLayoutProps, DataViewProps, DataViewQueryFilterName } from '../../components'
import { EntityListSubTreeMarker, Environment, FieldMarker, HasOneRelationMarker, MeaningfulMarker } from '@contember/binding'
import { EntityListSubTree, MarkerTreeGenerator } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { DataViewFilterHandler, DataViewSelectionLayout } from '../../types'
import deepEqual from 'fast-deep-equal'

export interface DataViewStaticInfo {
	filterTypes: Record<string, DataViewFilterHandler<any>>
	layouts: DataViewSelectionLayout[]
}

export const collectStaticInfo = (props: DataViewProps, env: Environment): DataViewStaticInfo => {
	const [node, envWithSelectionState] = createDataViewReactNode(props, env)
	const filterBoxes = dataViewFilterAnalyzer.processChildren(node, envWithSelectionState)
	const layoutBoxes = dataViewLayoutAnalyzer.processChildren(node, envWithSelectionState)

	const layouts = layoutBoxes.map(it => it.props)
	const filterTypes = getFilterTypes(props, env, filterBoxes)

	return { filterTypes, layouts }
}

const createDataViewReactNode = (props: DataViewProps, env: Environment) => {
	const selectionState = props.initialSelection && typeof props.initialSelection !== 'function' ? props.initialSelection : {}
	const envWithSelectionState = env.withExtension(dataViewSelectionEnvironmentExtension, selectionState)
	const entityListSubTree = <EntityListSubTree entities={props.entities} alias="__dataview_static">{props.children}</EntityListSubTree>
	return [entityListSubTree, envWithSelectionState] as const
}


const getQueryField = (props: DataViewProps, env: Environment) => {
	if (props.queryField) {
		return props.queryField
	}
	const [node, envWithSelectionState] = createDataViewReactNode(props, env)
	const markerTreeGenerator = new MarkerTreeGenerator(node, envWithSelectionState)
	const markerTree = markerTreeGenerator.generate()
	const placeholder = markerTree.placeholdersByAliases.get('__dataview_static')
	if (!placeholder) {
		throw new Error()
	}
	const marker = markerTree.subTrees.get(placeholder)
	if (!(marker instanceof EntityListSubTreeMarker)) {
		throw new Error()
	}
	return extractStringFields(marker)

}

const getFilterTypes = (props: DataViewProps, env: Environment, filterBoxes: DataViewFilterBox[]) => {

	const queryField = getQueryField(props, env)

	const filterTypes: Record<string, DataViewFilterHandler<any>> = props.filterTypes ?? {}
	if (queryField && !(DataViewQueryFilterName in filterTypes)) {
		filterTypes[DataViewQueryFilterName] = createUnionTextFilter(queryField)
	}
	for (const filterBox of filterBoxes) {
		if (filterBox.props.name in filterTypes) {
			const existingFilter = filterTypes[filterBox.props.name]
			if (!filterBox.props.filterHandler.identifier
				|| !existingFilter.identifier
				|| (filterBox.props.filterHandler.identifier.id === existingFilter.identifier.id
					&& deepEqual(filterBox.props.filterHandler.identifier.params, existingFilter.identifier.params)
				)) {
				continue
			}
			throw new Error(`Filter with name ${filterBox.props.name} already exists with different parameters:
#1: ${existingFilter.identifier.id.toString()} / ${JSON.stringify(existingFilter.identifier)}
#2: ${filterBox.props.filterHandler.identifier.id.toString()} / ${JSON.stringify(filterBox.props.filterHandler.identifier)}`)
		}


		filterTypes[filterBox.props.name] = filterBox.props.filterHandler
	}

	return filterTypes
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


const dataViewFilterAnalyzer = new ChildrenAnalyzer<
	DataViewFilterBox,
	never,
	Environment
>([filterLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})
const dataViewLayoutAnalyzer = new ChildrenAnalyzer<
	DataViewLayoutBox,
	never,
	Environment
>([layoutLeaf], {
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
