import { useEffect } from 'react'

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
