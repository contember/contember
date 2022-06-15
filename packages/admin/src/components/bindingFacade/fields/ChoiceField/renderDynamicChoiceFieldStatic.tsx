import { ReactElement } from 'react'
import { EntityListSubTree, Environment, Field, Filter, NIL_UUID } from '@contember/binding'
import { BaseDynamicChoiceField } from './BaseDynamicChoiceField'
import { getDesugaredEntityList, getDesugaredFieldList } from './hooks/useDesugaredOptionPath'

export const renderDynamicChoiceFieldStatic = (props: BaseDynamicChoiceField, environment: Environment, filter?: Filter | undefined): {
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


	if ('renderOption' in props || 'optionLabel' in props) {
		let renderedOptionBase
		if ('renderOption' in props) {
			renderedOptionBase =
				typeof props.optionsStaticRender === 'function'
					? props.optionsStaticRender(environment)
					: props.optionsStaticRender

		} else {
			renderedOptionBase = props.optionLabel
		}
		const renderedOption = (
			<>
				{searchByFields}
				{renderedOptionBase}
			</>
		)
		const entityList = getDesugaredEntityList(props.options, environment, props.lazy, filter)

		const subTree = (
			<>
				<EntityListSubTree entities={entityList} {...entityList} expectedMutation="none">
					{renderedOption}
				</EntityListSubTree>
				{props.createNewForm && (
					<EntityListSubTree entities={{
						entityName: entityList.entityName,
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
		const fieldList = getDesugaredFieldList(props.options, environment, props.lazy, filter)

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
