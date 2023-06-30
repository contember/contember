import { useCallback } from 'react'
import type { PanelState } from './Types'

export function useClosePanelOnEscape(behaviors: Array<PanelState['behavior']> = ['overlay', 'modal']) {
	return useCallback((event: KeyboardEvent, state: PanelState) => {
		if (event.key === 'Escape' && state.visibility === 'visible' && behaviors.includes(state.behavior)) {
			if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
				if (document.activeElement && document.activeElement instanceof HTMLElement) {
					blurElement(document.activeElement)
				}

				return { visibility: 'hidden' } as const
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(behaviors)])
}

function blurElement(element: HTMLElement) {
	const currentTabIndex = element.getAttribute('tabindex')

	element.setAttribute('tabindex', '0')
	element.blur()

	if (document.activeElement === element) {
		console.error('failed to blur element', element)

		if (import.meta.env.DEV) {
			throw new Error('failed to blur element')
		}
	} else if (typeof currentTabIndex === 'number') {
		element.setAttribute('tabindex', currentTabIndex)
	} else {
		element.removeAttribute('tabindex')
	}
}
