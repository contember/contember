import { LayoutPanel as Panel } from './LayoutPanel'
import { LayoutPanelBody as PanelBody } from './LayoutPanelBody'
import { LayoutPanelFooter as PanelFooter } from './LayoutPanelFooter'
import { LayoutPanelHeader as PanelHeader } from './LayoutPanelHeader'
import { LayoutPanelsStateProvider as PanelsStateProvider } from './LayoutPanelsStateProvider'
import { LayoutResponsiveContainer as ResponsiveContainer } from './LayoutResponsiveContainer'
import { LayoutRoot as Root } from './LayoutRoot'
export * from './Contexts'
export type { LayoutPanelBody, LayoutPanelBodyComponentType, LayoutPanelBodyProps, OwnLayoutPanelBodyProps } from './LayoutPanelBody'
export type { LayoutPanelFooter, LayoutPanelFooterComponentType, LayoutPanelFooterProps, OwnLayoutPanelFooterProps } from './LayoutPanelFooter'
export type { LayoutPanelHeader, LayoutPanelHeaderComponentType, LayoutPanelHeaderProps, OwnLayoutPanelHeaderProps } from './LayoutPanelHeader'
export * from './Types'
export * from './useClosePanelOnEscape'


export const Layout = {
	Root,
	ResponsiveContainer,
	Panel,
	PanelBody,
	PanelHeader,
	PanelFooter,
	PanelsStateProvider,
}
