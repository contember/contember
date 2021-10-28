import { LayoutPage, LayoutPageProps } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import type { PageProvider } from './Pages'

interface GenericPageProps extends Omit<LayoutPageProps, 'children'> {
	pageName: string
	children: ReactNode
}

const GenericPage: Partial<PageProvider<GenericPageProps>> & ComponentType<GenericPageProps> = memo(
	({ children, ...props }: GenericPageProps) => <LayoutPage {...props}>{children}</LayoutPage>,
)

GenericPage.displayName = 'GenericPage'
GenericPage.getPageName = (props: GenericPageProps) => props.pageName

export { GenericPage }
