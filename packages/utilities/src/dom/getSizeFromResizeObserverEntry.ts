export function getSizeFromResizeObserverEntryFactory(box: ResizeObserverOptions['box']) {
	return function getSizeFromResizeObserverEntry(entry: ResizeObserverEntry): { height: number, width: number } {
		const boxSize = box === 'border-box'
			? entry.borderBoxSize
			: box === 'content-box'
				? entry.contentBoxSize
				: entry.devicePixelContentBoxSize

		if (boxSize) {
			const formatBoxSize: ResizeObserverSize[] = Array.isArray(boxSize) ? boxSize : [boxSize]

			return formatBoxSize.reduce(
				(previous, { inlineSize, blockSize }) => ({
					width: previous.width + inlineSize,
					height: previous.height + blockSize,
				}),
				{ height: 0, width: 0 },
			)
		} else {
			return {
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			}
		}
	}
}
