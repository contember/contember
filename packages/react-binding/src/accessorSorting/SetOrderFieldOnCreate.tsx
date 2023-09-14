import type { CrudQueryBuilder, Input } from '@contember/client'
import { GraphQlLiteral } from '@contember/client'
import { QueryLanguage } from '@contember/binding'
import type {
	SugaredOrderBy,
	SugaredQualifiedEntityList,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { Component, EntityListSubTree, EntitySubTree, Field } from '../coreComponents'
import { SugaredField } from '../helperComponents'
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
						[desugaredOrderField.field]: new GraphQlLiteral(order),
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
					<EntitySubTree
						entity={entity}
						isCreating
						onBeforePersist={(getAccessor, bindingOperations) => {
							const listSubTree = bindingOperations.getEntityListSubTree(qel)
							const entities = Array.from(listSubTree)
							const newOrderFieldValue = !entities.length
								? 0
								: (entities[0].getRelativeSingleField<number>(desugaredOrderField).value ?? 0) + 1
							getAccessor().getRelativeSingleField<number>(desugaredOrderField).updateValue(newOrderFieldValue)
						}}
					>
						<SugaredField field={orderField} />
					</EntitySubTree>
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
					onBeforePersist={(getAccessor, bindingOperations) => {
						// We're creating a new entity which adjusts the numbering of the other ones if applicable
						// and then deleting it again which leaves a hole for newOrderFieldValue that is set above.
						let newEntityKey: string | undefined = undefined
						addEntityAtIndex(getAccessor(), desugaredOrderField, newOrderFieldValue, getNewEntity => {
							newEntityKey = getNewEntity().key
						})
						newEntityKey && bindingOperations.getEntityByKey(newEntityKey).deleteEntity()
					}}
				>
					<SugaredField field={orderField} />
				</EntityListSubTree>
			</>
		)
	},
	'SetOrderFieldOnCreate',
)
