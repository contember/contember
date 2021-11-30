import {
	Component,
	HasMany,
	QueryLanguage,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	useEntityList,
	wrapFilterInHasOnes,
} from '@contember/binding'
import type { FunctionComponent, ReactElement, ReactNode } from 'react'
import { useMemo } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { renderDynamicChoiceFieldStatic } from '../../../fields/ChoiceField/renderDynamicChoiceFieldStatic'
import { BaseDynamicChoiceField, useDesugaredOptionPath } from '../../../fields/ChoiceField/BaseDynamicChoiceField'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { SelectCellArtifacts, SelectCellFilter } from './SelectCellFilter'

export type HasManySelectProps =
	& DataGridColumnPublicProps
	& SugaredRelativeEntityList
	& BaseDynamicChoiceField
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleEntity
	& {
		renderElements?: (elements: ReactNode[]) => ReactElement
	}


export const HasManySelectCell: FunctionComponent<HasManySelectProps> = Component(props => {
	return (
		<DataGridColumn<SelectCellArtifacts>
			{...props}
			enableOrdering={false}
			getNewFilter={(filter, { environment }) => {
				if (filter.id.length === 0 && filter.nullCondition === false) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeEntityList(props, environment)
				const ors = []
				if (filter.id.length > 0) {
					ors.push(wrapFilterInHasOnes(desugared.hasOneRelationPath, {
						[desugared.hasManyRelation.field]: {
							id: { in: filter.id },
						},
					}))
				}
				if (filter.nullCondition === true) {
					ors.push({
						not: wrapFilterInHasOnes(desugared.hasOneRelationPath, {
							[desugared.hasManyRelation.field]: {
								id: { isNull: false },
							},
						}),
					})
				}

				return { or: ors }
			}}
			emptyFilter={{
				id: [],
				nullCondition: false,
			}}
			filterRenderer={filterProps => <SelectCellFilter optionProps={props} {...filterProps} />}
		>
			<HasManySelectCellContent {...props} />
		</DataGridColumn>
	)
}, 'HasManySelectField')


const HasManySelectCellContent = Component<HasManySelectProps>(
	props => {
		const desugaredOptionPath = useDesugaredOptionPath(props)
		const entities = useEntityList(props)
		const entitiesArray = useMemo(
			() => Array.from(entities, it => it.getEntity({ field: desugaredOptionPath.hasOneRelationPath })),
			[desugaredOptionPath.hasOneRelationPath, entities],
		)

		const elementsRenderer = props.renderElements ?? defaultElementsRenderer
		if ('renderOption' in props) {
			return elementsRenderer(entitiesArray.map(it => props.renderOption(it)))
		}

		if ('field' in desugaredOptionPath) {
			if (entitiesArray.length === 0) {
				return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
			}
			return elementsRenderer(entitiesArray.map(it => {
				const val = it.getField(desugaredOptionPath.field).value
				if (val !== null) {
					return <>{val}</>
				}
				return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
			}))
		}

		return <></>

	},
	(props, environment) => {
		const { subTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)

		return (
			<>
				{subTree}
				<HasMany field={props.field} expectedMutation="none">
					{renderedOption}
				</HasMany>
			</>
		)
	})


const defaultElementsRenderer = (elements: ReactNode[]): ReactElement => (
	<>
		{elements.map((it, index, arr) => <>{it}{index < (arr.length - 1) ? ', ' : ''}</>)}
	</>
)
