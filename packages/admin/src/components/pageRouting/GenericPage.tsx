import { ComponentType, memo, ReactNode } from 'react'
import { LayoutInner } from '../LayoutInner'
import type { PageProvider } from './Pages'

interface GenericPageProps {
	pageName: string
	children: ReactNode
}

const GenericPage: Partial<PageProvider<GenericPageProps>> & ComponentType<GenericPageProps> = memo(
	(props: GenericPageProps) => <LayoutInner>{props.children}</LayoutInner>,
)

GenericPage.displayName = 'GenericPage'
GenericPage.getPageName = (props: GenericPageProps) => props.pageName

export { GenericPage }
