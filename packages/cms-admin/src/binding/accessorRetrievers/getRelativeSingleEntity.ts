import { EntityAccessor } from '../accessors'
import { DataBindingError } from '../dao'
import { DesugaredRelativeSingleEntity, ExpectedEntityCount, RelativeSingleEntity } from '../treeParameters'

export const getRelativeSingleEntity = (
	relativeTo: EntityAccessor,
	{ hasOneRelationPath }: RelativeSingleEntity | DesugaredRelativeSingleEntity,
) => {
	for (let i = hasOneRelationPath.length - 1; i >= 0; i--) {
		const hasOneRelation = hasOneRelationPath[i]

		const field = relativeTo.data.getField(
			hasOneRelation.field,
			ExpectedEntityCount.UpToOne,
			hasOneRelation.filter,
			hasOneRelation.reducedBy,
		)

		if (field instanceof EntityAccessor) {
			relativeTo = field
		} else {
			throw new DataBindingError('Corrupted data')
		}
	}
	return relativeTo
}
