import * as React from 'react'
import Page, { PageProps } from './Page'
import PageProvider from './PageProvider'
import { connect } from 'react-redux'
import State from '../../state'

type PageProviderElement = React.ReactElement<any> & { type: PageProvider }
type PageElement = React.ReactElement<PageProps>
type PageChild = PageElement | PageProviderElement

export interface PagesProps {
	project: string
	stage: string
	children: PageChild[] | PageChild
}

export interface PagesStateProps {
	name: string
	parameters: any
}

function isPageProvider(el: any): el is PageProviderElement {
	return React.isValidElement(el) && typeof el.type === 'function' && typeof (el.type as any).getPageName === 'function'
}

function isPageElement(el: any): el is PageElement {
	if (React.isValidElement<PageProps>(el)) {
		return el.type === Page
	} else {
		return false
	}
}

export const ParametersContext = React.createContext<any>({})

class Pages extends React.Component<PagesProps & PagesStateProps> {
	render() {
		if (!this.props.children) return null
		let children: unknown[] = Array.isArray(this.props.children) ? this.props.children : [this.props.children]
		if (children.some(child => !isPageElement(child) && !isPageProvider(child))) {
			throw new Error('Pages has a child which is not a Page')
		} else {
			const child = (children as PageChild[]).find(
				child => (isPageProvider(child) ? child.type.getPageName(child.props) : child.props.name) === this.props.name
			)
			if (child === undefined) {
				throw new Error(`No such page as ${this.props.name}.`)
			}
			if (isPageProvider(child)) {
				return <ParametersContext.Provider value={this.props.parameters}>{child}</ParametersContext.Provider>
			} else {
				return child.props.children(this.props.parameters)
			}
		}
	}
}

export default connect<PagesStateProps, {}, PagesProps, State>(({ view }) => {
	if (view.route && view.route.name === 'project_page') {
		return { name: view.route.pageName, parameters: view.route.parameters }
	}
	throw new Error('Pages can be render in "project_page" route')
})(Pages)
