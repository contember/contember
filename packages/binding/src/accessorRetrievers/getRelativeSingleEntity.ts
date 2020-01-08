import { EntityAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { DesugaredRelativeSingleEntity, ExpectedEntityCount, RelativeSingleEntity } from '../treeParameters'

export const getRelativeSingleEntity = (
	relativeTo: EntityAccessor,
	{ hasOneRelationPath }: RelativeSingleEntity | DesugaredRelativeSingleEntity,
) => {
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
