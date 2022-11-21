import {
	Component,
	Entity,
	HasMany,
	QueryLanguage,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	useEntityList,
	wrapFilterInHasOnes,
} from '@contember/binding'
import { Fragment, FunctionComponent, ReactElement, ReactNode, useMemo } from 'react'
import { BaseDynamicChoiceField } from '../../../fields'
import { renderDynamicChoiceFieldStatic } from '../../../fields/ChoiceField/renderDynamicChoiceFieldStatic'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'
import { SelectCellArtifacts, SelectCellFilter } from './SelectCellFilter'
import { useDesugaredOptionPath } from '../../../fields/ChoiceField/hooks/useDesugaredOptionPath'

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
			filterRenderer={filterProps => <SelectCellFilter optionProps={{
				lazy: { initialLimit: 0 },
				...props,
			}} {...filterProps} />}
		>
			<HasManySelectCellContent lazy={{ initialLimit: 0 }} {...props} />
		</DataGridColumn>
	)
}, 'HasManySelectField')


const HasManySelectCellContent = Component<HasManySelectProps>(
	props => {
		const desugaredOptionPath = useDesugaredOptionPath(props, undefined)
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
				const val = it.getField<string | number>(desugaredOptionPath.field).value
				if (val !== null) {
					return <Fragment key={it.key}>{val}</Fragment>
				}
				return <FieldFallbackView key={it.key} fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
			}))
		}

		if ('optionLabel' in props) {
			return elementsRenderer(entitiesArray.map(it => (
				<Entity key={it.key} accessor={it}>{props.optionLabel}</Entity>
			)))
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
				<HasMany field={props.field} expectedMutation="none">
					{renderedOption}
				</HasMany>
			</>
		)
	})


const defaultElementsRenderer = (elements: ReactNode[]): ReactElement => (
	<>
		{elements.map((it, index, arr) => <Fragment key={typeof it === 'object' && it !== null && 'key' in it ? it.key : index}>{it}{index < (arr.length - 1) ? ', ' : ''}</Fragment>)}
	</>
)
