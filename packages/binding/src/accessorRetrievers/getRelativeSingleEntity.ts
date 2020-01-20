import { EntityAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { DesugaredRelativeSingleEntity, ExpectedEntityCount, RelativeSingleEntity } from '../treeParameters'

export const getRelativeSingleEntity = (
	relativeTo: EntityAccessor,
	entity: RelativeSingleEntity | DesugaredRelativeSingleEntity | string, // If this is a string, it *MUST NOT* make use of QL
) => {
	const hasOneRelationPath: DesugaredRelativeSingleEntity['hasOneRelationPath'] =
		typeof entity === 'string'
			? [
					{
						field: entity,
						reducedBy: undefined,
						filter: undefined,
					},
			  ]
			: entity.hasOneRelationPath
	for (const hasOneRelation of hasOneRelationPath) {
		const field = relativeTo.getField(
			hasOneRelation.field,
			ExpectedEntityCount.UpToOne,
			hasOneRelation.filter,
			hasOneRelation.reducedBy,
		)

		if (field instanceof EntityAccessor) {
			relativeTo = field
		} else {
			throw new BindingError('Corrupted data')
		}
	}
	return relativeTo
}
