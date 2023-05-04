import {
	Component,
	HasOne,
	QueryLanguage,
	SugaredRelativeSingleEntity,
	useEntity,
	wrapFilterInHasOnes,
} from '@contember/binding'
import type { FunctionComponent } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { renderDynamicChoiceFieldStatic } from '../../../fields/ChoiceField/renderDynamicChoiceFieldStatic'
import { BaseDynamicChoiceField } from '../../../fields'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { SelectCellArtifacts, SelectCellFilter } from './SelectCellFilter'
import { useDesugaredOptionPath } from '../../../fields/ChoiceField/hooks/useDesugaredOptionPath'

export type HasOneSelectProps =
	& DataGridColumnPublicProps
	& BaseDynamicChoiceField
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleEntity

/**
 * DataGrid cell which allows displaying and filtering by has-one relations.
 *
 * @example
 * ```
 * <HasOneSelectCell header="Category" field="category" options="Category.name" />
 * ```
 *
 * @group Data grid
 */
export const HasOneSelectCell: FunctionComponent<HasOneSelectProps> = Component(props => {
	return (
		<DataGridColumn<SelectCellArtifacts>
			{...props}
			enableOrdering={false}
			getNewFilter={(filter, { environment }) => {
				if (filter.id.length === 0 && filter.nullCondition === false) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleEntity(props, environment)
				const conditions = []
				if (filter.id.length > 0) {
					conditions.push({ in: filter.id })
				}
				if (filter.nullCondition === true) {
					conditions.push({ isNull: true })
				}

				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
						id: { or: conditions },
					})
			}}
			emptyFilter={{
				id: [],
				nullCondition: false,
			}}
			filterRenderer={filterProps => <SelectCellFilter optionProps={{
				lazy: { initialLimit: 0 },
				...props,
			}} {...filterProps} />}
		>
			<HasOneSelectCellContent lazy={{ initialLimit: 0 }} {...props} />
		</DataGridColumn>
	)
}, 'HasOneSelectField')

const HasOneSelectCellContent = Component<BaseDynamicChoiceField & SugaredRelativeSingleEntity & FieldFallbackViewPublicProps>(
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
			return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
		}

		if ('optionLabel' in props) {
			return <HasOne field={props.field} expectedMutation="none">{props.optionLabel}</HasOne>
		}

		return <></>

	},
	(props, environment) => {
		const { subTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)
		const { subTree: currentValuesSubtree } = renderDynamicChoiceFieldStatic(props, environment, { id: { in: [] } })

		return (
			<>
				{subTree}
				{currentValuesSubtree}
				<HasOne field={props.field} expectedMutation="none">
					{renderedOption}
				</HasOne>
			</>
		)
	})
