import { ReactElement, useCallback, useEffect } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDecoratedPersist } from './persist/useDecoratedPersist'
import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { useEntity } from '../accessorPropagation'
import { useMutationState } from '../accessorTree'
import { composeEventHandlers } from '@radix-ui/primitive'


const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>

export interface DeleteEntityTriggerProps {

	/**
	 * If true, binding will trigger persist immediately after the entity is deleted.
	 */
	immediatePersist?: boolean

	/**
	 * The button element.
	 */
	children: ReactElement

	/**
	 * Callback that is called when the entity is successfully deleted.
	 * Ignored if immediatePersist is not true.
	 */
	onPersistSuccess?: (result: SuccessfulPersistResult) => void

	/**
	 * Callback that is called when an error occurs during the deletion.
	 * Ignored if immediatePersist is not true.
	 */
	onPersistError?: (result: ErrorPersistResult) => void
}

/**
 * A button that deletes the current entity when clicked.
 *
 * If immediatePersist is true, the binding will trigger persist immediately after the entity is deleted.
 *
 * ## Props {@link DeleteEntityTriggerProps}
 * - children, ?immediatePersist, ?onPersistError, ?onPersistSuccess
 *
 * #### Example
 * ```tsx
 * <DeleteEntityTrigger immediatePersist>
 *     <button>Delete</button>
 * </DeleteEntityTrigger>
 * ```
 */
export const DeleteEntityTrigger = ({ immediatePersist, onPersistError, onPersistSuccess, ...props }: DeleteEntityTriggerProps) => {
	const parentEntity = useEntity()
	const triggerPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })
	const isMutating = useMutationState()
	const deleteEntity = useCallback(() => {
		parentEntity.deleteEntity()

		if (immediatePersist) {
			triggerPersist()
		}
	}, [parentEntity, immediatePersist, triggerPersist])

	useEffect(() => {
		if (!immediatePersist && (onPersistError || onPersistSuccess)) {
			console.warn('DeleteEntityTrigger: onPersistError and onPersistSuccess are ignored when immediatePersist is not true.')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return (
		<SlotType
			disabled={isMutating ? true : undefined}
			onClick={composeEventHandlers(deleteEntity, onClick)}
			{...otherProps}
		/>
	)
}
