import * as React from 'react'
import { useDesugaredRelativeSingleField, useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { FieldAccessor } from '../accessors'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'

const identityFunction = <Value>(value: Value) => value

/**
 * Derived fields are meant for cases when the user is expected to primarily edit the `sourceField` whose optionally
 * transformed value is then copied to the `derivedField`. This happens after each update until either the `derivedField`
 * is touched or until it is persisted at which point the tie between the fields is automatically severed.
 */
export const useDerivedField = <SourcePersisted extends FieldValue = FieldValue>(
	sourceField: string | SugaredRelativeSingleField,
	derivedField: string | SugaredRelativeSingleField,
	transform: (sourceValue: SourcePersisted | null) => SourcePersisted | null = identityFunction,
	agent: string = 'derivedField',
) => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)
	const stableBatchUpdatesReference = potentiallyStaleParent.batchUpdates

	const desugaredSource = useDesugaredRelativeSingleField(sourceField)
	const desugaredDerived = useDesugaredRelativeSingleField(derivedField)

	const potentiallyStaleSourceAccessor = potentiallyStaleParent.getRelativeSingleField<SourcePersisted>(desugaredSource)
	const stableAddEventListenerReference = potentiallyStaleSourceAccessor.addEventListener

	const onBeforeUpdate = React.useCallback<FieldAccessor.BeforeUpdateListener<SourcePersisted>>(
		sourceAccessor => {
			stableBatchUpdatesReference(getAccessor => {
				// This is tricky: we're deliberately getting the Entity, and not the field
				const derivedHostEntity = getAccessor().getRelativeSingleEntity(desugaredDerived)

				if (derivedHostEntity.existsOnServer) {
					return
				}

				const derivedAccessor = getAccessor().getRelativeSingleField<SourcePersisted, SourcePersisted>(desugaredDerived)

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

	React.useEffect(() => stableAddEventListenerReference('beforeUpdate', onBeforeUpdate), [
		onBeforeUpdate,
		stableAddEventListenerReference,
	])
}
