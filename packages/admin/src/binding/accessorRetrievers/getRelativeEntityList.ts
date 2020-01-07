import { EntityAccessor, EntityListAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { DesugaredRelativeEntityList, RelativeEntityList } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeEntityList = (
	relativeTo: EntityAccessor,
	{ hasOneRelationPath, hasManyRelation }: RelativeEntityList | DesugaredRelativeEntityList,
): EntityListAccessor => {
	const nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath })
	const field = nestedEntity.getField(hasManyRelation.field)

	if (!(field instanceof EntityListAccessor)) {
		throw new BindingError(`Corrupted data`)
	}
	return field
}
