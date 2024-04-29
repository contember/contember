import { useCallback, useState } from 'react'

export const useOpenState = () => {
	const [open, setOpen] = useState(false)

	const onOpenChange = useCallback(
		(_value = !open) => {
			setOpen(_value)
		},
		[open],
	)

	return {
		open,
		onOpenChange,
	}
}
