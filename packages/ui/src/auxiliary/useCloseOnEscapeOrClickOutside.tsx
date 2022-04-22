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

export const useCloseOnClickOutside = ({ isOpen, close, contents, outside }: { isOpen: boolean, close: () => void, contents: (Node | null)[], outside?: HTMLElement | null }) => {
	useEffect(() => {
		if (isOpen) {
			const closeOnClickOutside = (event: Event) => {
				const target = event.target
				if (
					target instanceof Node &&
					(!document.body.contains(target) ||
						target === document.body ||
						contents.some(it => it && it.contains(target)))
				) {
					return
				}
				if (contents.every(it => it === null)) {
					return
				}
				close()
			}
			(outside ?? window).addEventListener('click', closeOnClickOutside)
			return () => {
				(outside ?? window).removeEventListener('click', closeOnClickOutside)
			}
		}
	}, [close, isOpen, contents, outside])
}
