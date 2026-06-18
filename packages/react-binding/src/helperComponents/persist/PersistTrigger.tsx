import { ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { useDecoratedPersist } from './useDecoratedPersist.js'
import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { useDirtinessState, useMutationState } from '../../accessorTree/index.js'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface PersistTriggerAttributes {
	['data-dirty']?: ''
	['data-loading']?: ''
}

const SlotType = Slot as React.ForwardRefExoticComponent<
	React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & PersistTriggerAttributes
>

export interface PersistTriggerProps {
	/**
	 * The button element.
	 */
	children: ReactElement
	/**
	 * Callback that is called when persist is successful.
	 */
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	/**
	 * Callback that is called when an error occurs during persist.
	 */
	onPersistError?: (result: ErrorPersistResult) => void
}

/**
 * A button that triggers persist when clicked.
 *
 * ## Props {@link PersistTriggerProps}
 * - children, ?onPersistError, ?onPersistSuccess
 *
 * ## Example
 * ```tsx
 * <PersistTrigger>
 *     <button>Save</button>
 * </PersistTrigger>
 * ```
 */
export const PersistTrigger = ({ onPersistError, onPersistSuccess, ...props }: PersistTriggerProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })

	const isDisabled = isMutating || !isDirty

	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return (
		<SlotType
			disabled={isDisabled}
			data-dirty={dataAttribute(isDirty)}
			data-loading={dataAttribute(isMutating)}
			onClick={composeEventHandlers(triggerPersist, onClick)}
			{...otherProps}
		/>
	)
}
