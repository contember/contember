import { Environment, EnvironmentContext, useEnvironment } from '@contember/binding'
import { ContainerSpinner, Message } from '@contember/ui'
import { ComponentType, Fragment, isValidElement, lazy, ReactElement, ReactNode, ReactNodeArray, Suspense, useMemo, useRef } from 'react'
import { useCurrentRequest } from '../../routing'
import { MiscPageLayout } from '../MiscPageLayout'
import { PageErrorBoundary } from './PageErrorBoundary'

export interface PageProvider<P> {
	getPageName(props: P, fallback?: string): string
}

export type PageProviderElement = ReactElement<any, ComponentType & PageProvider<any>>

export interface PageModule {
	[action: string]: ComponentType | ReactElement | undefined
}

export type LazyPageModule = () => Promise<PageModule>

export type PagesMapElement =
	| LazyPageModule
	| PageModule
	| ComponentType
	| PageProviderElement

export type PagesMap = Record<string, PagesMapElement>

export interface PagesProps {
	children:
		| PagesMap
		| PageProviderElement[]
		| PageProviderElement
	layout?: ComponentType<{ children?: ReactNode }>
}

type PageActionHandler = ComponentType<{ action?: string }>

function isPageList(children: ReactNodeArray): children is PageProviderElement[] {
	return children.every(child => isPageProviderElement(child))
}

function findPrefix(strings: string[]): string {
	const sorted = [...strings].sort()
	const a = sorted[0]
	const b = sorted[sorted.length - 1]

	let i = 0
	let j = 0

	while (j < a.length && a.charAt(j) === b.charAt(j)) {
		j++

		if (a.charAt(j) === '/') {
			i = j + 1
		}
	}

	return a.substring(0, i)
}

function disallowAction(Component: ComponentType): PageActionHandler {
	return (props: { action?: string }) => {
		const pageName = useCurrentRequest()?.pageName

		if (props.action !== undefined) {
			throw new Error(`No such page as ${pageName}.`)
		}

		return <Component />
	}
}

/**
 * Pages element specifies collection of pages (component Page or component with getPageName static method).
 */
export const Pages = ({ children, layout }: PagesProps) => {
	const rootEnv = useEnvironment()
	const request = useCurrentRequest()
	const requestId = useRef<number>(0)
	const Layout = layout ?? Fragment

	const pageMap = useMemo<Map<string, PageActionHandler>>(
		() => {
			if (Array.isArray(children)) {
				if (isPageList(children)) {
					return new Map(children.map(child => [child.type.getPageName(child.props), disallowAction(() => child)]))

				} else {
					throw new Error('Pages has a child which is not a Page')
				}

			} else if (isPageProviderElement(children)) {
				return new Map([[children.type.getPageName(children.props), disallowAction(() => children)]])

			} else {
				const lazyPrefix = findPrefix(Object.entries(children).flatMap(([k, v]) => isLazyPageModule(k, v) || isEagerPageModule(k, v) ? [k] : []))

				return new Map(Object.entries(children).flatMap(([k, v]): [string, PageActionHandler][] => {
					if (isLazyPageModule(k, v)) { // children={import.meta.glob('./pages/**/*.tsx')}
						const pageName = k.slice(lazyPrefix.length, -4)

						const PageActionHandler = (props: { action?: string }) => {
							const Lazy = lazy(async () => {
								const module = await v()
								const page = module[props.action ?? 'default']

								if (page === undefined) {
									throw new Error(`No such page as ${pageName}${props.action ? '/' + props.action : ''}.`)
								}

								return { default: isValidElement(page) ? () => page : page }
							})

							return <Suspense fallback={<ContainerSpinner />}><Lazy /></Suspense>
						}

						return [[pageName, PageActionHandler]]

					} else if (isEagerPageModule(k, v)) { // children={import.meta.globEager('./pages/**/*.tsx')}
						const pageName = k.slice(lazyPrefix.length, -4)

						const PageActionHandler = (props: { action?: string }) => {
							const Page = v[props.action ?? 'default']

							if (Page === undefined) {
								throw new Error(`No such page as ${pageName}${props.action ? '/' + props.action : ''}.`)
							}

							return isValidElement(Page) ? Page : <Page />
						}

						return [[pageName, PageActionHandler]]

					} else {
						const pageName = k.slice(0, 1).toLowerCase() + k.slice(1)

						if (isPageProviderElement(v)) {
							return [[v.type.getPageName(v.props, pageName), disallowAction(() => v)]]

						} else {
							return [[pageName, disallowAction(v)]]
						}
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

	let pageKey = request.pageName
	let pageAction = undefined
	let Page = pageMap.get(pageKey)

	if (Page === undefined) {
		const pos = request.pageName.lastIndexOf('/')
		if (pos > 0) {
			pageKey = request.pageName.slice(0, pos)
			pageAction = request.pageName.slice(pos + 1)
			Page = pageMap.get(pageKey)
		}
	}

	if (Page === undefined) {
		throw new Error(`No such page as ${request.pageName}.`)
	}

	const requestEnv = rootEnv
		.updateDimensionsIfNecessary(request.dimensions, rootEnv.getAllDimensions())
		.putDelta(request.parameters)

	return (
		<EnvironmentContext.Provider value={requestEnv}>
			<Layout>
				<PageErrorBoundary key={requestId.current++}><Page action={pageAction} /></PageErrorBoundary>
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

function isLazyPageModule(name: string, it: any): it is LazyPageModule {
	return (name.endsWith('.tsx') || name.endsWith('.jsx')) && typeof it === 'function'
}

function isEagerPageModule(name: string, it: any): it is PageModule {
	return (name.endsWith('.tsx') || name.endsWith('.jsx')) && typeof it === 'object'
}
