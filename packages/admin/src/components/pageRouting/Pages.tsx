import { Environment, EnvironmentContext, useEnvironment } from '@contember/binding'
import { ContainerSpinner, Message } from '@contember/ui'
import {
	ComponentType,
	Fragment,
	isValidElement,
	lazy,
	ReactElement,
	ReactNode,
	ReactNodeArray,
	Suspense,
	useMemo,
	useRef,
} from 'react'
import { useCurrentRequest } from '../../routing'
import { MiscPageLayout } from '../MiscPageLayout'
import { PageErrorBoundary } from './PageErrorBoundary'

export interface PageProvider<P> {
	getPageName(props: P, fallback?: string): string
}

export type PageProviderElement = ReactElement<any, ComponentType & PageProvider<any>>

export interface PageSetProvider<P> {
	getPages(props: P): Record<string, ComponentType>
}

export type PageSetProviderElement = ReactElement<any, ComponentType & PageSetProvider<any>>

type EmptyObject = Record<any, never>

type PagesMapElement =
	| ComponentType
	| PageProviderElement
	| PageSetProviderElement
	| PageSetProvider<EmptyObject>

type PagesMap = Record<string, PagesMapElement>

type LazyPageMap = Record<string, () => Promise<{default?: ComponentType}>>

export interface PagesProps {
	children:
		| PagesMap
		| PageProviderElement[]
		| PageProviderElement
		| LazyPageMap
	layout?: ComponentType<{ children?: ReactNode }>
}


function isPageList(children: ReactNodeArray): children is PageProviderElement[] {
	return children.every(child => isPageProviderElement(child))
}

/**
 * Pages element specifies collection of pages (component Page or component with getPageName static method).
 */
export const Pages = ({ children, layout }: PagesProps) => {
	const rootEnv = useEnvironment()
	const request = useCurrentRequest()
	const requestId = useRef<number>(0)
	const Layout = layout ?? Fragment

	const pageMap = useMemo<Map<string, ComponentType>>(
		() => {
			if (Array.isArray(children)) {
				if (isPageList(children)) {
					return new Map(children.map(child => [child.type.getPageName(child.props), () => child]))

				} else {
					throw new Error('Pages has a child which is not a Page')
				}

			} else if (isPageProviderElement(children)) {
				return new Map([[children.type.getPageName(children.props), () => children]])

			} else {
				return new Map(Object.entries(children).flatMap(([k, v]): [string, ComponentType][] => {
					const pageName = k.slice(0, 1).toLowerCase() + k.slice(1)
					if (isPageSetProvider<EmptyObject>(v)) {
						return Object.entries(v.getPages({}))
					} else if (isPageSetProviderElement(v)) {
						return Object.entries(v.type.getPages(v.props))
					} else if (isPageProviderElement(v)) {
						return [[v.type.getPageName(v.props, pageName), () => v]]
					} else if (k.endsWith('.tsx') || k.endsWith('.jsx')) {
						const Lazy = lazy(v)
						const WithFallback = () => <Suspense fallback={<ContainerSpinner />}><Lazy /></Suspense>
						return [[k.slice(k.lastIndexOf('/') + 1, -4), WithFallback]]
					} else {
						return [[pageName, v]]
					}
				}))
			}
		},
		[children],
	)

	if (request === null) {
		return (
			<MiscPageLayout>
				<Message intent="danger" size="large">Page not found</Message>
			</MiscPageLayout>
		)
	}

	for (const reservedVariableName of Environment.reservedVariableNames) {
		if (reservedVariableName in request.parameters) {
			throw new Error(`Cannot use ${reservedVariableName} as parameter name.`)
		}
	}
	const Page = pageMap.get(request.pageName)

	if (Page === undefined) {
		throw new Error(`No such page as ${request.pageName}.`)
	}

	const requestEnv = rootEnv
		.updateDimensionsIfNecessary(request.dimensions, rootEnv.getAllDimensions())
		.putDelta(request.parameters)

	return (
		<EnvironmentContext.Provider value={requestEnv}>
			<Layout>
				<PageErrorBoundary key={requestId.current++}><Page /></PageErrorBoundary>
			</Layout>
		</EnvironmentContext.Provider>
	)
}


function isPageProvider(it: any): it is PageProvider<any> {
	return typeof it.getPageName === 'function'
}

function isPageProviderElement(el: ReactNode): el is PageProviderElement {
	return isValidElement(el) && typeof el.type !== 'string' && isPageProvider(el.type)
}


function isPageSetProvider<T = any>(it: any): it is PageSetProvider<T> {
	return typeof it === 'object' && it !== null && typeof it.getPages === 'function'
}

function isPageSetProviderElement(el: ReactNode): el is PageSetProviderElement {
	return isValidElement(el) && typeof el.type !== 'string' && isPageSetProvider(el.type)
}
