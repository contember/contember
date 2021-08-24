import { ComponentType, createContext, Fragment, isValidElement, ReactElement, ReactNode, ReactNodeArray } from 'react'
import { PageErrorBoundary } from './PageErrorBoundary'
import { Page, PageProps } from './Page'
import type { PageProvider } from './PageProvider'
import { EnvironmentContext, useEnvironment } from '@contember/binding'
import { useCurrentRequest } from '../../routing'

type PageProviderElement = ReactElement<any> & { type: PageProvider }
type PageElement = ReactElement<PageProps>
type PageChild = PageElement | PageProviderElement

export interface PagesProps {
	children: PageChild[] | PageChild
	layout?: ComponentType<{ children?: ReactNode }>
}

function isPageProvider(el: any): el is PageProviderElement {
	return isValidElement(el) && typeof (el.type as any).getPageName === 'function'
}

function isPageElement(el: any): el is PageElement {
	if (isValidElement<PageProps>(el)) {
		return el.type === Page
	} else {
		return false
	}
}

function isPageList(children: ReactNodeArray): children is PageChild[] {
	return children.every(child => isPageElement(child) || isPageProvider(child))
}

export type Parameters = any
export const ParametersContext = createContext<Parameters>({}) // TODO: drop? who needs this?

/**
 * Pages element specifies collection of pages (component Page or component with getPageName static method).
 */
export const Pages = (props: PagesProps) => {
	const rootEnv = useEnvironment()
	const request = useCurrentRequest()

	if (request === null || !props.children) {
		return null
	}

	const children: ReactNodeArray = Array.isArray(props.children) ? props.children : [props.children]

	if (!isPageList(children)) {
		throw new Error('Pages has a child which is not a Page')
	}

	const pageNames = children.map(child => isPageProvider(child) ? child.type.getPageName(child.props) : child.props.name)
	const matchedPageIndex = pageNames.findIndex(name => name === request.pageName)

	if (matchedPageIndex === -1) {
		throw new Error(`No such page as ${request.pageName}.`)
	}

	const matchedPage = children[matchedPageIndex]
	const pageName = pageNames[matchedPageIndex]

	const isProvider = isPageProvider(matchedPage)
	const Layout = props.layout || Fragment

	const requestEnv = rootEnv
		.updateDimensionsIfNecessary(request.dimensions, rootEnv.getAllDimensions()) // TODO: why updateDimensionsIfNecessary?
		.putDelta(request.parameters)

	return (
		<EnvironmentContext.Provider value={requestEnv}>
			<Layout>
				{isProvider && (
					<ParametersContext.Provider value={request.parameters}>
						<PageErrorBoundary key={pageName}>{matchedPage}</PageErrorBoundary>
					</ParametersContext.Provider>
				)}
				{isProvider || (
					<PageErrorBoundary key={pageName}>{matchedPage.props.children(request.parameters)}</PageErrorBoundary>
				)}
			</Layout>
		</EnvironmentContext.Provider>
	)
}
