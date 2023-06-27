import { createContext, useContext } from 'react'
import { ActiveSectionsTabsContextType, SectionTabProps, SectionTabsMap, SectionTabsRegistrationContextType } from './Types'

export const SectionTabsContext = createContext<SectionTabsMap>({})

export function useSectionTabs() {
	return useContext(SectionTabsContext)
}

export const ActiveSectionsTabsContext = createContext<ActiveSectionsTabsContextType>({})

export function useActiveSectionsTabs() {
	return useContext(ActiveSectionsTabsContext)
}

export const SectionTabsRegistrationContext = createContext<SectionTabsRegistrationContextType>([
	(tab: SectionTabProps) => { },
	(tab: SectionTabProps) => { },
])

export function useSectionTabsRegistration() {
	return useContext(SectionTabsRegistrationContext)
}
