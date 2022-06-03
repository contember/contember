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
import { BaseDynamicChoiceField } from '../../../fields/ChoiceField/BaseDynamicChoiceField'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { SelectCellArtifacts, SelectCellFilter } from './SelectCellFilter'
import { useDesugaredOptionPath } from '../../../fields/ChoiceField/hooks/useDesugaredOptionPath'

export type HasOneSelectProps =
	& DataGridColumnPublicProps
	& BaseDynamicChoiceField
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleEntity


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
			filterRenderer={filterProps => <SelectCellFilter optionProps={props} {...filterProps} />}
		>
			<HasOneSelectCellContent {...props} />
		</DataGridColumn>
	)
}, 'HasOneSelectField')

const HasOneSelectCellContent = Component<BaseDynamicChoiceField & SugaredRelativeSingleEntity & FieldFallbackViewPublicProps>(
	props => {
		const desugaredOptionPath = useDesugaredOptionPath(props)
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

		return <></>

	},
	(props, environment) => {
		const { subTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)

		return (
			<>
				{subTree}
				<HasOne field={props.field} expectedMutation="none">
					{renderedOption}
				</HasOne>
			</>
		)
	})
