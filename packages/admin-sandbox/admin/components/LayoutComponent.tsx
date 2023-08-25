import { LayoutComponent as bare } from './LayoutComponent[bare]'
import { LayoutComponent as _default } from './LayoutComponent[default]'
import { LayoutComponent as headlessCms } from './LayoutComponent[headless-cms]'
import { LayoutComponent as legacy } from './LayoutComponent[legacy]'
import { LayoutComponent as rightSidebar } from './LayoutComponent[right-sidebar]'

export const LayoutComponents = {
	'default': _default,
	'headless-cms': headlessCms,
	'right-sidebar': rightSidebar,
	legacy,
	bare,
} as const

export const layoutComponentTypeList = Object.keys(LayoutComponents) as ReadonlyArray<keyof typeof LayoutComponents>

export type LayoutType = typeof layoutComponentTypeList[number]
