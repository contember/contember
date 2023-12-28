import { ReactNode } from 'react'

export interface SectionTabsProps {
	children: ReactNode
}

export interface SectionTabProps {
	id: string
	label: ReactNode
}

export interface SectionTabsMap { [id: string]: SectionTabProps }

export type SectionTabsRegistrationContextType = [
	(tab: SectionTabProps) => void,
	(tab: SectionTabProps) => void,
]

export interface ActiveSectionTabProps {
	id: string
	time: number
	intersectionRatio: number
}

export interface ActiveSectionTabsMap { [id: string]: ActiveSectionTabProps }

export type ActiveSectionsTabsContextType = ActiveSectionTabsMap
