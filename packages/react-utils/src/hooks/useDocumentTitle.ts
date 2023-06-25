import { useEffect, useRef } from 'react'

export function useDocumentTitle(title: string | null | undefined, formatter?: (title: string, initialTitle: string) => string) {
	const initialTitle = useRef(document.title).current

	useEffect(() => {
		if (title) {
			if (formatter) {
				document.title = formatter(title, initialTitle)
			} else {
				document.title = title
			}
		} else {
			document.title = initialTitle
		}

		return () => {
			document.title = initialTitle
		}
	}, [formatter, initialTitle, title])
}
