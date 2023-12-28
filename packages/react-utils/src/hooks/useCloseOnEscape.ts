import { useEffect } from 'react'

export const useCloseOnEscape = ({ isOpen, close }: { isOpen: boolean, close: () => void }) => {
	useEffect(() => {
		if (isOpen) {
			const closeOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					close()
				}
			}
			window.addEventListener('keydown', closeOnEscapeKey)

			return () => {
				window.removeEventListener('keydown', closeOnEscapeKey)
			}
		}
	}, [close, isOpen])
}
