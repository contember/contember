import { useCallback, useEffect } from 'react'
import { useDesugaredRelativeSingleField, useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { FieldAccessor } from '../accessors'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'

const identityFunction = <Value>(value: Value) => value

// TODO this is fundamentally wrong. This shouldn't only happen on beforeUpdate, but also on initialize.
// 	we need a useEffect equivalent.

/**
 * Derived fields are meant for cases when the user is expected to primarily edit the `sourceField` whose optionally
 * transformed value is then copied to the `derivedField`. This happens after each update until either the `derivedField`
 * is touched or until it is persisted at which point the tie between the fields is automatically severed.
 * @deprecated
 */
export const useDerivedField = <SourceValue extends FieldValue = FieldValue>(
	sourceField: string | SugaredRelativeSingleField,
	derivedField: string | SugaredRelativeSingleField,
	transform: (sourceValue: SourceValue | null) => SourceValue | null = identityFunction,
	agent: string = 'derivedField',
) => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)
	const stableBatchUpdatesReference = potentiallyStaleParent.batchUpdates

	const desugaredSource = useDesugaredRelativeSingleField(sourceField)
	const desugaredDerived = useDesugaredRelativeSingleField(derivedField)

	const potentiallyStaleSourceAccessor = potentiallyStaleParent.getRelativeSingleField<SourceValue>(desugaredSource)
	const stableAddEventListenerReference = potentiallyStaleSourceAccessor.addEventListener

	const onBeforeUpdate = useCallback<FieldAccessor.BeforeUpdateListener<SourceValue>>(
		sourceAccessor => {
			stableBatchUpdatesReference(getAccessor => {
				// This is tricky: we're deliberately getting the Entity, and not the field
				const derivedHostEntity = getAccessor().getRelativeSingleEntity(desugaredDerived)

				if (derivedHostEntity.existsOnServer) {
					return
				}

				const derivedAccessor = getAccessor().getRelativeSingleField<SourceValue>(desugaredDerived)

				if (derivedAccessor.isTouched) {
					// Querying the user
					return
				}

				const transformedValue = transform(sourceAccessor.value)
				derivedAccessor.updateValue(transformedValue, {
					agent,
				})
			})
		},
		[agent, desugaredDerived, transform, stableBatchUpdatesReference],
	)

	useEffect(() => stableAddEventListenerReference('beforeUpdate', onBeforeUpdate), [
		onBeforeUpdate,
		stableAddEventListenerReference,
	])
}
