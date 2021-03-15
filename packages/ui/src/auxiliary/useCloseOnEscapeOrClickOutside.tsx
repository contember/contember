import { useEffect, useRef } from 'react'

export const useCloseOnEscapeOrClickOutside = <Reference extends Node, Content extends Node>(
	isOpen: boolean,
	close: () => void,
) => {
	const buttonRef = useRef<Reference>(null)
	const contentRef = useRef<Content>(null)

	useRawCloseOnEscapeOrClickOutside<Reference, Content>({
		reference: buttonRef.current,
		content: contentRef.current,
		isOpen,
		close,
	})

	return { buttonRef, contentRef }
}

export const useRawCloseOnEscapeOrClickOutside = <Reference extends Node, Content extends Node>({
	isOpen,
	close,
	reference,
	content,
}: {
	isOpen: boolean
	close: () => void
	reference: Reference | null
	content: Content | null
}) => {
	useEffect(() => {
		if (isOpen) {
			const closeOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					close()
				}
			}
			const closeOnClickOutside = (event: MouseEvent) => {
				if (
					event.target instanceof Node &&
					(!document.body.contains(event.target) ||
						event.target === document.body ||
						(reference && reference.contains(event.target)) ||
						(content && content.contains(event.target)))
				) {
					return
				}
				if (!content && !reference) {
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
