import { useCallback } from 'react'
import { usePersist } from '../../accessorPropagation'
import { ErrorPersistResult, isErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'

export interface UseDecoratedPersistOptions {
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

export const useDecoratedPersist = ({ onPersistSuccess, onPersistError }: UseDecoratedPersistOptions = {}) => {
	const triggerPersist = usePersist()

	return useReferentiallyStableCallback(async () => {
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
	})
}
