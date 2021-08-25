import type { ComponentType, ReactElement } from 'react'
import type { RouteMap } from '../pageRouting/utils'
import type { MessageDictionaryByLocaleCode } from '../../i18n'
import type { SelectedDimension } from '../../routing'

export interface ProjectConfig {
	project: string
	stage: string
	component: (() => Promise<{ default: ComponentType }>) | ReactElement // TODO: drop support for lazy loaded component?
	routes: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	dictionaries?: MessageDictionaryByLocaleCode
}
