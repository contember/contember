import { ComponentType } from 'react'
import { RouteMap } from '../components/pageRouting/utils'
import { MessageDictionaryByLocaleCode } from '../i18n'
import { SelectedDimension } from './request'

export interface ProjectConfig {
	project: string
	stage: string
	component: () => Promise<{ default: ComponentType }>
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
