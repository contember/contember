import {
	DataBindingStateComponentProps,
	EnvironmentContext,
	useEnvironment,
} from '@contember/binding'
import { ContainerSpinner, Message } from '@contember/ui'
import {
	ComponentType,
	Fragment,
	ReactElement,
	ReactNode,
	Suspense,
	isValidElement,
	lazy,
	useMemo,
	useRef,
} from 'react'
import { useCurrentRequest } from '../../routing'
import { MiscPageLayout } from '../MiscPageLayout'
import { PageErrorBoundary } from './PageErrorBoundary'

export interface PageProvider<P> {
	getPageName(props: P, fallback?: string): string
}

export type PageProviderElement = ReactElement<any, ComponentType<any> & PageProvider<any>>

export interface PageModule {
	[action: string]: ComponentType<any> | ReactElement<any> | undefined
}

export type LazyPageModule = () => Promise<PageModule>

export type PagesMapElement =
	| LazyPageModule
	| PageModule
	| ComponentType<any>
	| ReactElement<any>
	| PageProviderElement

export type PagesMap = Record<string, PagesMapElement>

export interface PagesProps {
	children:
	| PagesMap
	| PageProviderElement[]
	| PageProviderElement
	layout?: ComponentType<{ children?: ReactNode }>
	bindingFeedbackRenderer?: ComponentType<DataBindingStateComponentProps>
}

type PageActionHandler = ComponentType<{ action?: string }>

function findPrefix(strings: string[]): string {
	if (strings.length === 0) {
		return ''
	}

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
export const Pages = ({ children, layout, bindingFeedbackRenderer }: PagesProps) => {
	const rootEnv = useEnvironment()
	const request = useCurrentRequest()
	const requestId = useRef<number>(0)
	const Layout = layout ?? Fragment

	const pageMap = useMemo<Map<string, PageActionHandler>>(
		() => {
			if (Array.isArray(children)) {
				if (children.every(child => isPageProviderElement(child))) {
					return new Map(children.map(child => [child.type.getPageName(child.props), disallowAction(() => child)]))

				} else {
					throw new Error('Pages has a child which is not a Page')
				}

			} else if (isPageProviderElement(children)) {
				return new Map([[children.type.getPageName(children.props), disallowAction(() => children)]])

			} else {
				const modules = Object.entries(children).filter(([k, v]) => isLazyPageModule(k, v) || isEagerPageModule(k, v))
				const modulesPrefix = findPrefix(modules.map(it => it[0]))
				const getPageNameFromFile = (name: string) => name.slice(modulesPrefix.length, -4)

				return new Map(Object.entries(children).flatMap(([k, v]): [string, PageActionHandler][] => {
					if (isLazyPageModule(k, v)) { // children={import.meta.glob('./pages/**/*.tsx')}
						const pageName = getPageNameFromFile(k)

						const PageActionHandler = (props: { action?: string }) => {
							const Lazy = lazy(async () => {
								const module = normalizeModule(await v())
								const page = module[props.action ?? 'default']

								if (page === undefined) {
									throw new Error(`No such page as ${pageName}${props.action ? '/' + props.action : ''}.`)
								}

								return { default: isValidElement<any>(page) ? () => page : page }
							})

							return <Suspense fallback={<ContainerSpinner />}><Lazy /></Suspense>
						}

						return [[pageName, PageActionHandler]]

					} else if (isEagerPageModule(k, v)) { // children={import.meta.glob('./pages/**/*.tsx', { eager: false })}
						const pageName = getPageNameFromFile(k)
						const module = normalizeModule(v)

						const PageActionHandler = (props: { action?: string }) => {
							const Page = module[props.action ?? 'default']

							if (Page === undefined) {
								throw new Error(`No such page as ${pageName}${props.action ? '/' + props.action : ''}.`)
							}

							return isValidElement<any>(Page) ? Page : <Page />
						}

						return [[pageName, PageActionHandler]]

					} else {
						const pageName = lowerFirst(k)

						if (isPageProviderElement(v)) {
							return [[v.type.getPageName(v.props, pageName), disallowAction(() => v)]]

						} else if (isValidElement<any>(v)) {
							return [[pageName, disallowAction(() => v)]]

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
		.withDimensions(request.dimensions)
		.withParameters(request.parameters)

	return (
		<EnvironmentContext.Provider value={requestEnv}>
			<Layout>
				<PageErrorBoundary key={requestId.current++}>
					<Page action={pageAction} />
				</PageErrorBoundary>
			</Layout>
		</EnvironmentContext.Provider>
	)
}


function isPageProvider(it: any): it is PageProvider<any> {
	return typeof it.getPageName === 'function'
}

function isPageProviderElement(el: {} | null | undefined): el is PageProviderElement {
	return isValidElement(el) && typeof el.type !== 'string' && isPageProvider(el.type)
}

function isLazyPageModule(name: string, it: any): it is LazyPageModule {
	return (name.endsWith('.tsx') || name.endsWith('.jsx')) && typeof it === 'function'
}

function isEagerPageModule(name: string, it: any): it is PageModule {
	return (name.endsWith('.tsx') || name.endsWith('.jsx')) && typeof it === 'object'
}

function lowerFirst(val: string) {
	return val.slice(0, 1).toLowerCase() + val.slice(1)
}

function normalizeModule<V>(map: Record<string, V>): Record<string, V> {
	return Object.fromEntries(Object.entries(map).map(([k, v]) => [lowerFirst(k), v]))
}
