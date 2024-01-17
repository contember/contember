import { Component, HasOne, QueryLanguage, SugaredRelativeSingleEntity, useEntity, wrapFilterInHasOnes } from '@contember/react-binding'
import type { ComponentType, FunctionComponent } from 'react'
import { BaseDynamicChoiceField, renderDynamicChoiceFieldStatic, useDesugaredOptionPath, useSelectOptions, useCurrentlyChosenEntities } from '@contember/react-choice-field'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'
import { createHasOneFilter, SelectCellArtifacts } from '@contember/react-dataview'
import { SelectCellFilterExtraProps } from './common'

export type HasOneSelectRendererProps =
	& BaseDynamicChoiceField
	& SugaredRelativeSingleEntity
	& {
		initialFilter?: SelectCellArtifacts
	}

export type HasOneSelectProps =
	& HasOneSelectRendererProps
	& DataGridColumnCommonProps


export const createHasOneSelectCell = <ColumnProps extends {}, ValueRendererProps extends {}>({ FilterRenderer, ValueRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<SelectCellArtifacts, SelectCellFilterExtraProps>>,
	ValueRenderer: ComponentType<HasOneSelectRendererProps & ValueRendererProps>
}): FunctionComponent<HasOneSelectProps & ColumnProps & ValueRendererProps> => Component(props => {
	return (
		<DataGridColumn<SelectCellArtifacts>
			{...props}
			enableOrdering={false}
			getNewFilter={createHasOneFilter(props.field)}
			emptyFilter={{
				id: [],
				nullCondition: false,
			}}
			filterRenderer={filterProps => {
				const optionProps = {
					lazy: { initialLimit: 0 },
					...props,
				}
				const currentlyChosenEntities = useCurrentlyChosenEntities(optionProps, filterProps.filter.id)
				const selectProps = useSelectOptions(optionProps, currentlyChosenEntities)

				return <FilterRenderer {...selectProps} {...filterProps} />
			}}
		>
			<ValueRenderer lazy={{ initialLimit: 0 }} {...props} />
		</DataGridColumn>
	)
}, 'HasOneSelectField')

export const createHasOneSelectCellRenderer = <FallbackProps extends {}>({ FallbackRenderer = () => null }: {
	FallbackRenderer?: ComponentType<FallbackProps>
}) => Component<HasOneSelectRendererProps & FallbackProps>(
	props => {
		const desugaredOptionPath = useDesugaredOptionPath(props, undefined)
		const entity = useEntity(props).getEntity({ field: desugaredOptionPath.hasOneRelationPath })

		if ('renderOption' in props) {
			return <>{props.renderOption(entity)}</>
		}

		if ('field' in desugaredOptionPath) {
			const val = entity.getField(desugaredOptionPath).value
			if (val !== null) {
				return <>{val}</>
			}
			return <FallbackRenderer {...props} />
		}

		if ('optionLabel' in props) {
			return <HasOne field={props.field} expectedMutation="none">{props.optionLabel}</HasOne>
		}

		return <></>

	},
	(props, environment) => {
		const { listSubTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)
		const { listSubTree: currentValuesSubtree } = renderDynamicChoiceFieldStatic(props, environment, { id: { in: [] } })

		return (
			<>
				{listSubTree}
				{currentValuesSubtree}
				<HasOne field={props.field} expectedMutation="none">
					{renderedOption}
				</HasOne>
			</>
		)
	})
