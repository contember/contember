import { EntityAccessor, EntityListAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { DesugaredRelativeEntityList, RelativeEntityList } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeEntityList = (
	relativeTo: EntityAccessor,
	entityList: RelativeEntityList | DesugaredRelativeEntityList | string, // If this is a string, it *MUST NOT* make use of QL
): EntityListAccessor => {
	let nestedEntity: EntityAccessor
	let fieldName: string

	if (typeof entityList === 'string') {
		nestedEntity = relativeTo
		fieldName = entityList
	} else {
		nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath: entityList.hasOneRelationPath })
		fieldName = entityList.hasManyRelation.field
	}

	const field = nestedEntity.getField(fieldName)

	if (!(field instanceof EntityListAccessor)) {
		throw new BindingError(
			`Trying to access the entity list '${field}'${
				nestedEntity.typename ? ` of the '${nestedEntity.typename}' entity` : ''
			} but it does not exist.`,
		)
	}
	return field
}
