import { ToOne } from '../../coreComponents'
import { DataBindingError, EntityAccessor, ReferenceMarker } from '../../dao'

export const getNestedEntity = (entity: EntityAccessor, toOneProps: ToOne.AtomicPrimitiveProps[]) => {
	for (let i = toOneProps.length - 1; i >= 0; i--) {
		const props = toOneProps[i]

		const field = entity.data.getField(
			props.field,
			ReferenceMarker.ExpectedCount.UpToOne,
			props.filter,
			props.reducedBy,
		)

		if (field instanceof EntityAccessor) {
			entity = field
		} else {
			throw new DataBindingError('Corrupted data')
		}
	}
	return entity
}
