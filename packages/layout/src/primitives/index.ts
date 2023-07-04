export * from './Contexts'
export * from './Panel'
export * from './PanelBody'
export * from './PanelFooter'
export * from './PanelHeader'
export * from './PanelsStateProvider'
export * from './ResponsiveContainer'
export * from './Root'
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
