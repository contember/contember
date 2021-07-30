import type { ComponentType, ReactElement } from 'react'
import type { RouteMap } from '../components/pageRouting/utils'
import type { MessageDictionaryByLocaleCode } from '../i18n'
import type { SelectedDimension } from './request'

export interface ProjectConfig {
	project: string
	stage: string
	component: (() => Promise<{ default: ComponentType }>) | ReactElement
	routes: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	dictionaries?: MessageDictionaryByLocaleCode
}

export default interface ProjectsConfigsState {
	configs: ProjectConfig[]
}

export const emptyProjectsConfigsState: ProjectsConfigsState = {
	configs: [],
}
