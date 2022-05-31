import { useContext } from 'react'
import { DialogContext } from './DialogContext'
import type { DialogOptions } from './DialogOptions'

export const useDialog = <Result>(): DialogOptions<Result> => {
	const dialog = useContext(DialogContext)

	if (dialog === undefined) {
		throw new Error(`Cannot useDialog outwith DialogProvider.`)
	}
	return dialog
}
