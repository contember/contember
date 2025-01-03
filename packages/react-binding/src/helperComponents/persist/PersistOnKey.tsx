import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { useEffect } from 'react'
import { useDecoratedPersist } from './useDecoratedPersist'

export type PersistOnKeyProps = {
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
	/**
	 * Optional function that decides whether a given KeyboardEvent
	 * should trigger the persist action.
	 */
	isHotkey?: (event: KeyboardEvent) => boolean
}

export const PersistOnKey = ({
	onPersistSuccess,
	onPersistError,
	isHotkey,
}: PersistOnKeyProps) => {
	const doPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })

	useEffect(() => {
		const shouldHandleHotkey = isHotkey ?? defaultHotkeyCheck

		const listener = (event: KeyboardEvent) => {
			if (shouldHandleHotkey(event)) {
				event.preventDefault()
				doPersist()
			}
		}

		document.body.addEventListener('keydown', listener)
		return () => {
			document.body.removeEventListener('keydown', listener)
		}
	}, [doPersist, isHotkey]) // Re-run effect if these change

	return null
}

// Default hotkey check: ctrl+s or command+s
const defaultHotkeyCheck = (event: KeyboardEvent) => {
	return (
		(event.ctrlKey || event.metaKey) &&
		event.key.toLowerCase() === 's'
	)
}
