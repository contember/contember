import { ReactElement, ReactNode } from 'react'
import {
	EntityListSubTree,
	Environment,
	Field,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
} from '@contember/binding'
import { BaseDynamicChoiceField } from './BaseDynamicChoiceField'

export const renderDynamicChoiceFieldStatic = (props: BaseDynamicChoiceField, environment: Environment): {
	subTree: ReactElement
	renderedOption: ReactElement
} => {
	const searchByFields =
		props.searchByFields !== undefined &&
		(Array.isArray(props.searchByFields) ? (
			props.searchByFields.map((field, i) => <Field field={field} key={i} />)
		) : (
			<Field field={props.searchByFields} />
		))

	let renderedOptionBase: ReactNode

	if ('renderOption' in props) {
		renderedOptionBase =
			typeof props.optionsStaticRender === 'function'
				? props.optionsStaticRender(environment)
				: props.optionsStaticRender
	} else {
		// TODO this is wasteful
		const sugaredFieldList: SugaredQualifiedFieldList =
			typeof props.options === 'string' || !('fields' in props.options) ? { fields: props.options } : props.options
		const fieldList = QueryLanguage.desugarQualifiedFieldList(sugaredFieldList, environment)
		renderedOptionBase = <Field field={fieldList} />
	}

	const renderedOption = (
		<>
			{searchByFields}
			{renderedOptionBase}
		</>
	)

	if ('renderOption' in props) {
		const sugaredEntityList: SugaredQualifiedEntityList =
			typeof props.options === 'string' || !('entities' in props.options)
				? { entities: props.options }
				: props.options
		const subTree = (
			<EntityListSubTree {...sugaredEntityList} expectedMutation="none">
				{renderedOption}
			</EntityListSubTree>
		)
		return { subTree, renderedOption }
	} else {
		const sugaredFieldList: SugaredQualifiedFieldList =
			typeof props.options === 'string' || !('fields' in props.options) ? { fields: props.options } : props.options
		const fieldList = QueryLanguage.desugarQualifiedFieldList(sugaredFieldList, environment)
		const subTree = (
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
		return { subTree, renderedOption }
	}
}
