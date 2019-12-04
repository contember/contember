import { GraphQlBuilder } from '@contember/client'
import { EntityAccessor, FieldAccessor } from '../accessors'
import { DataBindingError } from '../dao'
import { DesugaredRelativeSingleField, RelativeSingleField, Scalar } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	relativeTo: EntityAccessor,
	{ name, hasOneRelationPath }: RelativeSingleField | DesugaredRelativeSingleField,
) => {
	const nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath })
	const accessor = nestedEntity.data.getField(name)

	if (!(accessor instanceof FieldAccessor)) {
		throw new DataBindingError(
			`Trying to access the field '${accessor}''${
				nestedEntity.typename ? `of the '${nestedEntity.typename}' entity` : ''
			}' but it does not exist.`,
		)
	}
	return (accessor as unknown) as FieldAccessor<Persisted, Produced>
}
