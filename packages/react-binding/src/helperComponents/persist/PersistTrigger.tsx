import { ComponentType, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { useDecoratedPersist } from './useDecoratedPersist'
import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { useDirtinessState, useMutationState } from '../../accessorTree'

const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

export interface PersistTriggerProps {
	children: ReactElement
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

export const PersistTrigger = ({ onPersistError, onPersistSuccess, ...props }: PersistTriggerProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })

	const isDisabled = isMutating || !isDirty

	return (
		<SlotButton
			disabled={isDisabled}
			data-dirty={dataAttribute(isDirty)}
			data-loading={dataAttribute(isMutating)}
			onClick={triggerPersist}
			{...props}
		/>
	)
}
