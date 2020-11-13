import * as React from 'react'

export const useCloseOnEscapeOrClickOutside = <T extends Node, K extends Node>(isOpen: boolean, close: () => void) => {
	const buttonRef = React.useRef<T>(null)
	const contentRef = React.useRef<K>(null)

	useRawCloseOnEscapeOrClickOutside<T, K>({
		reference: buttonRef.current,
		content: contentRef.current,
		isOpen,
		close,
	})

	return { buttonRef, contentRef }
}

export const useRawCloseOnEscapeOrClickOutside = <T extends Node, K extends Node>({
	isOpen,
	close,
	reference,
	content,
}: {
	isOpen: boolean
	close: () => void
	reference: Node | null
	content: Node | null
}) => {
	React.useEffect(() => {
		if (isOpen) {
			const closeOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					close()
				}
			}
			const closeOnClickOutside = (event: MouseEvent) => {
				if (
					reference &&
					content &&
					event.target instanceof Node &&
					(!document.body.contains(event.target) ||
						reference === event.target ||
						content === event.target ||
						reference.contains(event.target) ||
						content.contains(event.target))
				) {
					return
				}
				close()
			}
			window.addEventListener('keydown', closeOnEscapeKey)
			window.addEventListener('click', closeOnClickOutside)
			return () => {
				window.removeEventListener('keydown', closeOnEscapeKey)
				window.removeEventListener('click', closeOnClickOutside)
			}
		}
	}, [close, content, isOpen, reference])
}
