import { EntityAccessor, EntityListAccessor } from '../accessors'
import { DataBindingError } from '../dao'
import { DesugaredRelativeEntityList, RelativeEntityList } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeEntityList = (
	relativeTo: EntityAccessor,
	{ hasOneRelationPath, hasManyRelation }: RelativeEntityList | DesugaredRelativeEntityList,
): EntityListAccessor => {
	const nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath })
	const field = nestedEntity.data.getField(hasManyRelation.field)

	if (!(field instanceof EntityListAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return field
}
