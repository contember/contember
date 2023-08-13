import { createNonNullableContextFactory } from '@contember/react-utils'
import type { PanelConfig, PanelState } from './Types'

export type PanelWidthContextType = {
	height: number,
	width: number,
}
export const [PanelWidthContext, usePanelWidthContext] = createNonNullableContextFactory<PanelWidthContextType>('PanelWidthContext')
PanelWidthContext.displayName = 'PanelWidthContext'

export type LayoutPanelCallback = (name: string) => void
export type SetLayoutPanelVisibility = LayoutPanelCallback
export type RegisterLayoutPanel = (name: string, config: PanelConfig) => void;
export type UnregisterLayoutPanel = LayoutPanelCallback
export type UpdateLayoutPanelConfig = Partial<Omit<PanelConfig, 'name'> & { passive?: boolean }>
export type UpdateLayoutPanel = (name: string, config: UpdateLayoutPanelConfig | null | undefined | void) => void;
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
	panels: Map<string, PanelConfig>;
	currentlyActivePanel: string | undefined;
}
export const [GetLayoutPanelsStateContext, useGetLayoutPanelsStateContext] = createNonNullableContextFactory<GetLayoutPanelsStateContextType>('GetLayoutPanelsStateContext')
GetLayoutPanelsStateContext.displayName = 'GetLayoutPanelsStateContext'

export const [LayoutPanelContext, useLayoutPanelContext] = createNonNullableContextFactory<PanelState>('LayoutPanelContext')
LayoutPanelContext.displayName = 'LayoutPanelContext'
