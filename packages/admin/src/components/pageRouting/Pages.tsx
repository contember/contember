import { Environment, EnvironmentContext, useEnvironment } from '@contember/binding'
import { Message } from '@contember/ui'
import {
	ComponentType,
	Fragment,
	FunctionComponent,
	isValidElement,
	ReactElement,
	ReactNode,
	ReactNodeArray,
	useMemo,
	useRef,
} from 'react'
import { useCurrentRequest } from '../../routing'
import { MiscPageLayout } from '../MiscPageLayout'
import { PageErrorBoundary } from './PageErrorBoundary'

export type PageProvider<P> = ComponentType & {
	getPageName(props: P): string
}

export type PageProviderElement = ReactElement<any, PageProvider<any>>

export interface PagesProps {
	children: PageProviderElement[] | PageProviderElement | Record<string, FunctionComponent>
	layout?: ComponentType<{ children?: ReactNode }>
}

function isPageProviderElement(el: ReactNode): el is PageProviderElement {
	return isValidElement(el) && typeof el.type !== 'string' && typeof (el.type as any).getPageName === 'function'
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

	const pageMap = useMemo<Map<string, FunctionComponent>>(
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
				return new Map(Object.entries(children))
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
