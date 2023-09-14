import { ReactElement, ReactNode } from 'react'
import { EntityListSubTree, Environment, Field, Filter } from '@contember/react-binding'
import { BaseDynamicChoiceField } from './BaseDynamicChoiceField'
import { getDesugaredEntityList, getDesugaredFieldList } from './hooks/useDesugaredOptionPath'

export const renderDynamicChoiceFieldListStatic = (props: BaseDynamicChoiceField, environment: Environment, filter?: Filter | undefined) => {
	const renderedOption = renderDynamicChoiceFieldOptionStatic(props, environment, filter)
	return renderDynamicChoiceFieldListStaticInternal(props, renderedOption, environment, filter)

}

export const renderDynamicChoiceFieldStatic = (props: BaseDynamicChoiceField, environment: Environment, filter?: Filter | undefined): {
	listSubTree: ReactElement
	renderedOption: ReactElement
} => {
	const renderedOption = renderDynamicChoiceFieldOptionStatic(props, environment, filter)
	const listSubTree = renderDynamicChoiceFieldListStaticInternal(props, renderedOption, environment, filter)

	return { renderedOption, listSubTree }
}

const renderDynamicChoiceFieldListStaticInternal = (props: BaseDynamicChoiceField, renderedOption: ReactNode, environment: Environment, filter?: Filter | undefined) => {

	if ('renderOption' in props || 'optionLabel' in props) {
		const entityList = getDesugaredEntityList(props.options, environment, props.lazy, filter)

		return (
			<EntityListSubTree entities={entityList} {...entityList} expectedMutation="none">
				{renderedOption}
			</EntityListSubTree>
		)

	} else {
		const fieldList = getDesugaredFieldList(props.options, environment, props.lazy, filter)

		return (
			<EntityListSubTree
				{...fieldList}
				entities={{
					entityName: fieldList.entityName,
					filter: fieldList.filter,
				}}
				expectedMutation="none"
			>
				{renderedOption}
			</EntityListSubTree>
		)
	}
}

const renderDynamicChoiceFieldOptionStatic = (props: BaseDynamicChoiceField, environment: Environment, filter?: Filter | undefined) => {
	const searchByFields = getSearchByFields(props)
	const renderedOptionBase = getRenderedOptionBase(props, environment, filter)
	return (
		<>
			{searchByFields}
			{renderedOptionBase}
		</>
	)
}

const getSearchByFields = (props: BaseDynamicChoiceField): ReactNode => {
	if (props.searchByFields === undefined) {
		return undefined
	}
	const fields = Array.isArray(props.searchByFields) ? props.searchByFields : [props.searchByFields]

	return <>
		{fields.map((field, i) => <Field field={field} key={i} />)}
	</>
}

const getRenderedOptionBase = (props: BaseDynamicChoiceField, environment: Environment, filter?: Filter) => {
	if ('renderOption' in props) {
		return typeof props.optionsStaticRender === 'function'
			? props.optionsStaticRender(environment)
			: props.optionsStaticRender
	} else if ('optionLabel' in props) {
		return props.optionLabel
	} else {
		const fieldList = getDesugaredFieldList(props.options, environment, props.lazy, filter)

		return <Field field={fieldList} />
	}
}
