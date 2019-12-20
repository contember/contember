import * as React from 'react'
import { LayoutInner } from '../LayoutInner'
import { PageProvider } from './PageProvider'

interface GenericPageProps {
	pageName: string
	children: React.ReactNode
}

const GenericPage: Partial<PageProvider<GenericPageProps>> &
	React.ComponentType<GenericPageProps> = React.memo((props: GenericPageProps) => (
	<LayoutInner>{props.children}</LayoutInner>
))

GenericPage.displayName = 'GenericPage'
GenericPage.getPageName = (props: GenericPageProps) => props.pageName

export { GenericPage }
