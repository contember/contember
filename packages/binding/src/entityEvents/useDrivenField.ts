import * as React from 'react'
import { useDesugaredRelativeSingleField } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'
import { useEntityBeforeUpdate } from './useEntityBeforeUpdate'

const identityFunction = <Value>(value: Value) => value

/**
 * Driven fields are meant for cases when the user is expected to primarily edit the `driverField` whose optionally
 * transformed value is then copied to the `drivenField`. This happens after each update until either the `drivenField`
 * is touched or until it is persisted at which point the tie between the fields is severed.
 */
export const useDrivenField = <DriverPersisted extends FieldValue = FieldValue>(
	driverField: string | SugaredRelativeSingleField,
	drivenField: string | SugaredRelativeSingleField,
	transform: (driverValue: DriverPersisted | null) => DriverPersisted | null = identityFunction,
	agent: string = 'drivenField',
) => {
	const previousDriverValue = React.useRef<DriverPersisted | null | undefined>(undefined)
	const desugaredDriver = useDesugaredRelativeSingleField(driverField)
	const desugaredDriven = useDesugaredRelativeSingleField(drivenField)

	const onBeforeUpdate = React.useCallback<EntityAccessor.BatchUpdatesHandler>(
		getAccessor => {
			const driverAccessor = getAccessor().getRelativeSingleField<DriverPersisted>(desugaredDriver)

			if (previousDriverValue.current !== undefined && previousDriverValue.current === driverAccessor.currentValue) {
				return
			}
			// This is tricky: we're deliberately getting the Entity, and not the field
			const drivenHostEntity = getAccessor().getRelativeSingleEntity(desugaredDriven)

			if (drivenHostEntity.existsOnServer) {
				return
			}

			const drivenAccessor = getAccessor().getRelativeSingleField<DriverPersisted, DriverPersisted>(desugaredDriven)

			if (drivenAccessor.isTouched) {
				// Querying the user
				return
			}

			const transformedValue = transform(driverAccessor.currentValue)
			drivenAccessor.updateValue?.(transformedValue, {
				agent,
			})

			previousDriverValue.current = driverAccessor.currentValue
		},
		[agent, desugaredDriven, desugaredDriver, transform],
	)

	useEntityBeforeUpdate(onBeforeUpdate)
}
