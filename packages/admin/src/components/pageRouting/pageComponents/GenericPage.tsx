import { LayoutPage, LayoutPageProps } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import type { PageProvider } from '../Pages'
import { getPageName } from './getPageName'

export type GenericPageProps =
	& Omit<LayoutPageProps, 'children'>
	& {
		pageName?: string
		children: ReactNode
	}

const GenericPage: Partial<PageProvider<GenericPageProps>> & ComponentType<GenericPageProps> = memo(
	({ children, ...props }: GenericPageProps) => <LayoutPage {...props}>{children}</LayoutPage>,
)

GenericPage.displayName = 'GenericPage'
GenericPage.getPageName = getPageName

export { GenericPage }
