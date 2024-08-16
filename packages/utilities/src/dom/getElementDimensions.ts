/**
 * Calls the callback with the element's dimensions.
 *
 * @param element - The element to observe for dimensions
 * @param callback - The callback to call with the element's dimensions
 */
export function getElementDimensionsCallback(
	element: HTMLElement,
	callback: (dimensions: DOMRectReadOnly) => void,
) {
	const observer = new IntersectionObserver((entries, observer) => {
		if (entries.length === 1) {
			callback(entries[0].boundingClientRect)
		} else {
			const entry = entries.find(entry => entry.boundingClientRect.width > 0 || entry.boundingClientRect.height > 0) || entries[0]
			callback(entry.boundingClientRect)
		}

		observer.disconnect()
	})

	observer.observe(element)
}

/**
 * Returns a promise that resolves with the element's dimensions.
 * @param element - The element to observe for dimensions
 * @returns A promise that resolves with the element's dimensions
 */
export function getElementDimensions(
	element: HTMLElement,
): Promise<DOMRectReadOnly> {
	return new Promise(resolve => {
		getElementDimensionsCallback(element, resolve)
	})
}
