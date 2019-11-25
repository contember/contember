import { EntityAccessor, EntityListAccessor } from '../accessors'
import { DataBindingError } from '../dao'
import { RelativeEntityList } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeEntityList = (
	relativeTo: EntityAccessor,
	{ hasOneRelationPath, hasManyRelationPath }: RelativeEntityList,
): EntityListAccessor => {
	const nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath })
	const field = nestedEntity.data.getField(hasManyRelationPath.field)

	if (!(field instanceof EntityListAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return field
}
