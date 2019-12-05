import { EntityAccessor } from '../accessors'
import { DataBindingError } from '../dao'
import { DesugaredRelativeSingleEntity, ExpectedEntityCount, RelativeSingleEntity } from '../treeParameters'

export const getRelativeSingleEntity = (
	relativeTo: EntityAccessor,
	{ hasOneRelationPath }: RelativeSingleEntity | DesugaredRelativeSingleEntity,
) => {
	for (const hasOneRelation of hasOneRelationPath) {
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
