import { useCallback } from 'react'
import type { LayoutPanelState } from './Types'

export function useClosePanelOnEscape(behaviors: Array<LayoutPanelState['behavior']> = ['overlay', 'modal']) {
	return useCallback((event: KeyboardEvent, state: LayoutPanelState) => {
		if (event.key === 'Escape' && state.visibility === 'visible' && behaviors.includes(state.behavior)) {
			if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
				return { visibility: 'hidden' } as const
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(behaviors)])
}
