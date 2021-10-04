import { PageLayoutContent } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import type { PageProvider } from './Pages'

interface GenericPageProps {
	pageName: string
	children: ReactNode
}

const GenericPage: Partial<PageProvider<GenericPageProps>> & ComponentType<GenericPageProps> = memo(
	(props: GenericPageProps) => <PageLayoutContent>{props.children}</PageLayoutContent>,
)

GenericPage.displayName = 'GenericPage'
GenericPage.getPageName = (props: GenericPageProps) => props.pageName

export { GenericPage }
