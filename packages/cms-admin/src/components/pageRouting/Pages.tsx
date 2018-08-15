import * as React from 'react'
import Page, { PageProps } from './Page'
import { connect } from 'react-redux'
import State from '../../state'

type PageElement = React.ReactElement<PageProps>

export interface PagesProps {
	project: string
	stage: string
	children: PageElement[] | PageElement
}

export interface PagesStateProps {
	name: string
	parameters: any
}

function isPageElement(el: any): el is PageElement {
	if (React.isValidElement<PageProps>(el)) {
		return el.type === Page
	} else {
		return false
	}
}

class Pages extends React.Component<PagesProps & PagesStateProps> {
	render() {
		if (!this.props.children) return null
		let children: unknown[] = Array.isArray(this.props.children) ? this.props.children : [this.props.children]
		if (children.some(child => !isPageElement(child))) {
			throw new Error('Pages has a child which is not a Page')
		} else {
			const child = (children as PageElement[]).find(child => child.props.name === this.props.name)
			if (child === undefined) {
				throw new Error(`No such page as ${this.props.name}.`)
			}
			return child.props.children(this.props.parameters)
		}
	}
}

export default connect<PagesStateProps, {}, PagesProps, State>(({ view }) => {
	if (view.route && view.route.name === 'project_page') {
		return { name: view.route.pageName, parameters: view.route.parameters }
	}
	throw new Error('Pages can be render in "project_page" route')
})(Pages)
