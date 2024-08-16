import { ErrorPersistResult, SuccessfulPersistResult, useDirtinessState, useMutationState, usePersist } from '@contember/react-binding'
import { useCallback, useRef } from 'react'
import { useRegisterRequestChangeListener } from '@contember/react-routing'

export type BlockNavigationOnDirtyStateResult = 'save' | 'discard' | 'cancel'

export const useBlockNavigationOnDirtyState = (handler: () => Promise<BlockNavigationOnDirtyStateResult>, options?: {
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}) => {
	const isDirty = useDirtinessState()
	const isDirtyRef = useRef(isDirty)
	isDirtyRef.current = isDirty
	const isMutating = useMutationState()
	const isMutatingRef = useRef(isMutating)
	isMutatingRef.current = isMutating
	const persist = usePersist()

	useRegisterRequestChangeListener(useCallback(async event => {
		if (!isDirtyRef.current || isMutatingRef.current) {
			return
		}
		const result = await handler()
		if (result === 'cancel') {
			event.abortNavigation()
			return
		}

		if (result === 'save') {
			try {
				const result = await persist()
				options?.onPersistSuccess?.(result)
			} catch (e: any) {
				options?.onPersistError?.(e)
				event.abortNavigation()
				return
			}
		}
	}, [handler, options, persist]))
}
