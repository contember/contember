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

// TODO: Remove all deprecated exports in 1.3
import { ContainerWidthContext, ContainerWidthContextType, useDocumentTitle as _useDocumentTitle, useContainerWidth } from '@contember/react-utils'
/** @deprecated use `import type { ContainerWidthContextType }  from '@contember/react-utils'`  */
export type LayoutContainerWidthContextType = ContainerWidthContextType;
/** @deprecated use `import type { ContainerWidthContext }  from '@contember/react-utils'`  */
export const LayoutContainerWidthContext = ContainerWidthContext
/** @deprecated use `import { useContainerWidth }  from '@contember/react-utils'`  */
export const useLayoutContainerWidth = useContainerWidth
/** @deprecated use `import { useDocumentTitle }  from '@contember/react-utils'`  */
export const useDocumentTitle = _useDocumentTitle

export const Layout = {
	Root,
	ResponsiveContainer,
	Panel,
	PanelBody,
	PanelHeader,
	PanelFooter,
	PanelsStateProvider,
}
