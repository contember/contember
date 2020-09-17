import { CrudQueryBuilder, Input } from '@contember/client'
import * as React from 'react'
import { Component, EntityListSubTree, Field, SingleEntitySubTree } from '../coreComponents'
import { Literal } from '../dao'
import { SugaredField } from '../helperComponents'
import { QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedEntityList,
	SugaredOrderBy,
	SugaredQualifiedEntityList,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { addEntityAtIndex } from './addEntityAtIndex'

export interface SetOrderFieldOnCreateOwnProps {
	orderField: SugaredRelativeSingleField | string
	newOrderFieldValue?: number
}

export interface SetOrderFieldOnCreateProps
	extends SetOrderFieldOnCreateOwnProps,
		Pick<SugaredUnconstrainedQualifiedSingleEntity, 'entity'> {}

export const SetOrderFieldOnCreate = Component<SetOrderFieldOnCreateProps>(
	() => null,
	({ orderField, newOrderFieldValue, entity }, environment) => {
		const desugaredOrderField = QueryLanguage.desugarRelativeSingleField(orderField, environment)
		const getOrderBy = (order: 'asc' | 'desc'): SugaredOrderBy => [
			desugaredOrderField.hasOneRelationPath
				.map(relation => relation.field)
				.reduceRight(
					(accumulator, currentValue) => ({
						[currentValue]: accumulator,
					}),
					{
						[desugaredOrderField.field]: new Literal(order),
					} as Input.OrderBy<CrudQueryBuilder.OrderDirection>,
				),
		]

		if (newOrderFieldValue === undefined) {
			const qel: SugaredQualifiedEntityList = {
				entities: entity,
				expectedMutation: 'none',
				limit: 1,
				orderBy: getOrderBy('desc'),
			}
			return (
				<>
					<SingleEntitySubTree
						entity={entity}
						isCreating
						onBeforePersist={(getAccessor, extraProps) => {
							const listSubTree = extraProps.getSubTree(
								new BoxedQualifiedEntityList(QueryLanguage.desugarQualifiedEntityList(qel, environment)),
							)
							const entities = Array.from(listSubTree)
							const newOrderFieldValue = !entities.length
								? 0
								: (entities[0].getRelativeSingleField<number>(desugaredOrderField).currentValue ?? 0) + 1
							getAccessor().getRelativeSingleField<number>(desugaredOrderField).updateValue(newOrderFieldValue)
						}}
					>
						<SugaredField field={orderField} />
					</SingleEntitySubTree>
					<EntityListSubTree {...qel}>
						<SugaredField field={orderField} />
					</EntityListSubTree>
				</>
			)
		}
		return (
			<>
				<Field field={desugaredOrderField} defaultValue={newOrderFieldValue} isNonbearing />
				<EntityListSubTree
					entities={entity}
					expectedMutation="anyMutation"
					orderBy={getOrderBy('asc')}
					onBeforePersist={getAccessor => {
						let newEntityKey: string | undefined = undefined
						addEntityAtIndex(getAccessor(), desugaredOrderField, newOrderFieldValue, getNewEntity => {
							newEntityKey = getNewEntity().key
						})
						newEntityKey && getAccessor().getChildEntityByKey(newEntityKey).deleteEntity?.()
					}}
				>
					<SugaredField field={orderField} />
				</EntityListSubTree>
			</>
		)
	},
	'SetOrderFieldOnCreate',
)
