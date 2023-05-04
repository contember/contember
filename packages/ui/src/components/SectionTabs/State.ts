import { ActiveSectionTabProps, ActiveSectionTabsMap, SectionTabProps, SectionTabsMap } from './Types'


interface SectionTabsMapAction {
	type: 'REGISTER' | 'UNREGISTER',
	payload: SectionTabProps,
}

export function sectionTabsMapReducer(state: SectionTabsMap, { type, payload }: SectionTabsMapAction): SectionTabsMap {
	switch (type) {
		case 'REGISTER':
			return { ...state, [payload.id]: payload }
		case 'UNREGISTER':
			const newState = { ...state }
			delete newState[payload.id]

			return newState
		default:
			throw new Error(`Unhandled type: ${type}`)
	}
}

interface ActiveTabsMapAction {
	type: 'SET' | 'UNSET',
	payload: ActiveSectionTabProps,
}

export function activeSectionTabsMapReducer(state: ActiveSectionTabsMap, {
	type,
	payload,
}: ActiveTabsMapAction): ActiveSectionTabsMap {
	switch (type) {
		case 'SET':
			return { ...state, [payload.id]: payload }
		case 'UNSET':
			const newState = { ...state }
			delete newState[payload.id]

			return newState
		default:
			throw new Error(`Unhandled type: ${type}`)
	}
}
