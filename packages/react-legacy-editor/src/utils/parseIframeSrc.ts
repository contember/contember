export const parseIframeSrc = (source: string): string | undefined => {
	if (source.startsWith('<iframe')) {
		const parser = new DOMParser()
		try {
			const { body } = parser.parseFromString(source, 'text/html')
			if (body.children.length === 1 && body.children[0] instanceof HTMLIFrameElement) {
				const iFrame = body.children[0]
				return iFrame.src
			}
		} catch {}
	}
	return undefined
}
