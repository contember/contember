import { Layout as cms } from './Layout.cms'
import { Layout as _default } from './Layout.default'

export const Layouts = {
	cms,
	default: _default,
} as const

export const layoutTypeList = Object.keys(Layouts) as ReadonlyArray<keyof typeof Layouts>

export type LayoutType = typeof layoutTypeList[number]
