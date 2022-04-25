import { ReactElement } from 'react'
import {
	EntityListSubTree,
	Environment,
	Field,
	NIL_UUID,
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


	if ('renderOption' in props) {
		const renderedOptionBase =
			typeof props.optionsStaticRender === 'function'
				? props.optionsStaticRender(environment)
				: props.optionsStaticRender
		const renderedOption = (
			<>
				{searchByFields}
				{renderedOptionBase}
			</>
		)
		const sugaredEntityList: SugaredQualifiedEntityList =
			typeof props.options === 'string' || !('entities' in props.options)
				? { entities: props.options }
				: props.options

		const subTree = (
			<>
				<EntityListSubTree {...sugaredEntityList} expectedMutation="none">
					{renderedOption}
				</EntityListSubTree>
				{props.createNewForm && (
					<EntityListSubTree entities={{
						entityName: typeof sugaredEntityList.entities === 'string' ? sugaredEntityList.entities : sugaredEntityList.entities.entityName,
						filter: { id: { eq: NIL_UUID } },
					}} expectedMutation={'none'}>
						{props.createNewForm}
						{renderedOption}
					</EntityListSubTree>
				)}
			</>
		)

		return { subTree, renderedOption }

	} else {
		const sugaredFieldList: SugaredQualifiedFieldList =
			typeof props.options === 'string' || !('fields' in props.options) ? { fields: props.options } : props.options
		const fieldList = QueryLanguage.desugarQualifiedFieldList(sugaredFieldList, environment)
		const renderedOptionBase = <Field field={fieldList} />
		const renderedOption = (
			<>
				{searchByFields}
				{renderedOptionBase}
			</>
		)

		const subTree = (
			<>
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
				{props.createNewForm && (
					<EntityListSubTree entities={{
						entityName: fieldList.entityName,
						filter: { id: { eq: NIL_UUID } },
					}} expectedMutation={'none'}>
						{props.createNewForm}
						{searchByFields}
						{renderedOptionBase}
					</EntityListSubTree>
				)}
			</>
		)

		return { subTree, renderedOption }
	}
}
