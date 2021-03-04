import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { LayoutInner } from '../LayoutInner'
import { PageProvider } from './PageProvider'

interface GenericPageProps {
	pageName: string
	children: ReactNode
}

const GenericPage: Partial<PageProvider<GenericPageProps>> &
	ComponentType<GenericPageProps> = memo((props: GenericPageProps) => (
	<LayoutInner>{props.children}</LayoutInner>
))

GenericPage.displayName = 'GenericPage'
GenericPage.getPageName = (props: GenericPageProps) => props.pageName

export { GenericPage }
