import type { SortableContainerProps } from 'react-sortable-hoc'

const interactiveElements = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'BUTTON'])

// This is almost completely copied from the defaultShouldCancelStart.js from react-sortable-hoc.
// We just needed to add support for slate void elements as well as some additional checks.
export const shouldCancelStart: SortableContainerProps['shouldCancelStart'] = event => {
	// Cancel sorting if the event target is an `input`, `textarea`, `select` or `option`
	if (!(event.target instanceof Element)) {
		return true
	}

	let el: Node | null = event.target

	while (el) {
		if (el instanceof Element) {
			if (interactiveElements.has(el.tagName)) {
				return true
			}
			if (el.getAttribute('data-slate-void') === 'true') {
				return false
			}
			if (el instanceof HTMLElement && el.contentEditable === 'true') {
				return true
			}
		}
		el = el.parentNode
	}

	return false
}
