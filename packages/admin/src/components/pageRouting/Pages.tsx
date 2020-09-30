import { DevErrorBoundary } from '@contember/ui'
import * as React from 'react'
import { connect } from 'react-redux'
import State from '../../state'
import { Page, PageProps } from './Page'
import { PageProvider } from './PageProvider'

type PageProviderElement = React.ReactElement<any> & { type: PageProvider }
type PageElement = React.ReactElement<PageProps>
type PageChild = PageElement | PageProviderElement

export interface PagesProps {
	children: PageChild[] | PageChild
	layout?: React.ComponentType<{ children?: React.ReactNode }>
}

export interface PagesStateProps {
	name: string
	parameters: any
}

function isPageProvider(el: any): el is PageProviderElement {
	return React.isValidElement(el) && typeof (el.type as any).getPageName === 'function'
}

function isPageElement(el: any): el is PageElement {
	if (React.isValidElement<PageProps>(el)) {
		return el.type === Page
	} else {
		return false
	}
}

function isPageList(children: React.ReactNodeArray): children is PageChild[] {
	return children.every(child => isPageElement(child) || isPageProvider(child))
}

export type Parameters = any
export const ParametersContext = React.createContext<Parameters>({})

/**
 * Pages element specifies collection of pages (component Page or component with getPageName static method).
 */
class Pages extends React.PureComponent<PagesProps & PagesStateProps> {
	render() {
		if (!this.props.children) return null
		const children: React.ReactNodeArray = Array.isArray(this.props.children)
			? this.props.children
			: [this.props.children]

		if (!isPageList(children)) {
			throw new Error('Pages has a child which is not a Page')
		}

		const pageNames = children.map(child =>
			isPageProvider(child) ? child.type.getPageName(child.props) : child.props.name,
		)
		const matchedPageIndex = pageNames.findIndex(name => name === this.props.name)

		if (matchedPageIndex === -1) {
			throw new Error(`No such page as ${this.props.name}.`)
		}
		const matchedPage = children[matchedPageIndex]
		const pageName = pageNames[matchedPageIndex]

		const isProvider = isPageProvider(matchedPage)
		const Layout = this.props.layout || React.Fragment
		return (
			<DevErrorBoundary>
				<Layout>
					{isProvider && (
						<ParametersContext.Provider value={this.props.parameters}>
							<React.Fragment key={pageName}>{matchedPage}</React.Fragment>
						</ParametersContext.Provider>
					)}
					{isProvider || (
						<React.Fragment key={pageName}>{matchedPage.props.children(this.props.parameters)}</React.Fragment>
					)}
				</Layout>
			</DevErrorBoundary>
		)
	}
}

export default connect<PagesStateProps, {}, PagesProps, State>(({ view }) => {
	if (view.route && view.route.name === 'project_page') {
		return { name: view.route.pageName, parameters: view.route.parameters }
	}
	throw new Error('Pages can be render in "project_page" route')
})(Pages)
