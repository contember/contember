import { Layout as bare } from './Layout.bare'
import { Layout as cms } from './Layout.cms'
import { Layout as _default } from './Layout.default'
import { Layout as legacy } from './Layout.legacy'

export const Layouts = {
	default: _default,
	cms,
	legacy,
	bare,
} as const

export const layoutTypeList = Object.keys(Layouts) as ReadonlyArray<keyof typeof Layouts>

export type LayoutType = typeof layoutTypeList[number]
