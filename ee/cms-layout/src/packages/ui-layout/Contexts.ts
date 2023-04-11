import { createContext, useContext } from 'react'
import { createNonNullableContextFactory } from '../react-context-utilities'
import { useWindowSize } from '../react-hooks'
import type { LayoutPanelConfig, LayoutPanelState } from './Types'

export type PanelWidthContextType = {
	height: number,
	width: number,
}
export const [PanelWidthContext, usePanelWidthContext] = createNonNullableContextFactory<PanelWidthContextType>('PanelWidthContext')
PanelWidthContext.displayName = 'PanelWidthContext'

export type LayoutContainerWidthContextType = number
export const LayoutContainerWidthContext = createContext<LayoutContainerWidthContextType | null>(null)
LayoutContainerWidthContext.displayName = 'LayoutContainerWidthContext'
export function useLayoutContainerWidth<T>(): number {
	const maybeContainerWidth = useContext(LayoutContainerWidthContext)
	const { width: windowWidth } = useWindowSize()

	return maybeContainerWidth ?? windowWidth
}

export type LayoutPanelCallback = (name: string) => void
export type SetLayoutPanelVisibility = LayoutPanelCallback
export type RegisterLayoutPanel = (name: string, config: LayoutPanelConfig) => void;
export type UnregisterLayoutPanel = LayoutPanelCallback
export type UpdateLayoutPanel = (name: string, config: Partial<Omit<LayoutPanelConfig, 'name'>> | null | undefined | void) => void;
export type SetLayoutPanelsStateContextType = {
	registerLayoutPanel: RegisterLayoutPanel;
	unregisterLayoutPanel: UnregisterLayoutPanel;
	show: SetLayoutPanelVisibility;
	hide: SetLayoutPanelVisibility;
	update: UpdateLayoutPanel;
	reset: SetLayoutPanelVisibility;
	activate: LayoutPanelCallback;
	deactivate: LayoutPanelCallback;
}
export const [SetLayoutPanelsStateContext, useSetLayoutPanelsStateContext] = createNonNullableContextFactory<SetLayoutPanelsStateContextType>('SetLayoutPanelsStateContext')
SetLayoutPanelsStateContext.displayName = 'SetLayoutPanelsStateContext'

export type GetLayoutPanelsStateContextType = {
	allPanelsCanBeVisible?: boolean;
	panels: Map<string, LayoutPanelConfig>;
	currentlyActivePanel: string | undefined;
}
export const [GetLayoutPanelsStateContext, useGetLayoutPanelsStateContext] = createNonNullableContextFactory<GetLayoutPanelsStateContextType>('GetLayoutPanelsStateContext')
GetLayoutPanelsStateContext.displayName = 'GetLayoutPanelsStateContext'

export const [LayoutPanelContext, useLayoutPanelContext] = createNonNullableContextFactory<LayoutPanelState>('LayoutPanelContext')
LayoutPanelContext.displayName = 'LayoutPanelContext'
