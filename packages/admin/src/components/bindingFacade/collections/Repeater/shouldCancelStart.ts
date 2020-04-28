import { SortableContainerProps } from 'react-sortable-hoc'

// This is almost completely copied from the defaultShouldCancelStart.js from react-sortable-hoc.
// We just needed to add support for slate void elements as well as some additional checks.
export const shouldCancelStart: SortableContainerProps['shouldCancelStart'] = event => {
	// Cancel sorting if the event target is an `input`, `textarea`, `select` or `option`
	const interactiveElements = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'BUTTON']

	if (!(event.target instanceof Node)) {
		return true
	}

	if (event.target instanceof Element && interactiveElements.indexOf(event.target.tagName) !== -1) {
		// Return true to cancel sorting
		return true
	}

	let el: Node | null = event.target

	while (el) {
		if (el instanceof Element && el.getAttribute('data-slate-void') === 'true') {
			return false
		}
		if (el instanceof HTMLElement && el.contentEditable === 'true') {
			return true
		}
		el = el.parentNode
	}

	return false
}
