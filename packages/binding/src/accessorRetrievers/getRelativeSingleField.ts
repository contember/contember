import { GraphQlBuilder } from '@contember/client'
import { EntityAccessor, FieldAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { DesugaredRelativeSingleField, RelativeSingleField, Scalar } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	relativeTo: EntityAccessor,
	{ field, hasOneRelationPath }: RelativeSingleField | DesugaredRelativeSingleField,
) => {
	const nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath })
	const accessor = nestedEntity.getField(field)

	if (!(accessor instanceof FieldAccessor)) {
		throw new BindingError(
			`Trying to access the field '${field}'${
				nestedEntity.typename ? ` of the '${nestedEntity.typename}' entity` : ''
			} but it does not exist.`,
		)
	}
	return (accessor as unknown) as FieldAccessor<Persisted, Produced>
}
