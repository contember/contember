import { useCallback } from 'react'
import { usePersist } from '../../accessorPropagation'
import { ErrorPersistResult, isErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'

export interface UseDecoratedPersistOptions {
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

export const useDecoratedPersist = ({ onPersistSuccess, onPersistError }: UseDecoratedPersistOptions = {}) => {
	const triggerPersist = usePersist()

	return useCallback(async () => {
		try {
			const result = await triggerPersist()
			onPersistSuccess?.(result)
		} catch (e) {
			if (isErrorPersistResult(e)) {
				onPersistError?.(e)
			} else {
				throw e
			}
		}
	}, [onPersistError, onPersistSuccess, triggerPersist])
}
