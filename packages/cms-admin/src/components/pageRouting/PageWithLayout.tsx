import * as React from 'react'
import { LayoutContext } from './Pages'

interface PageWithLayoutProps {
	layout?: React.ComponentType<{ children?: React.ReactNode }>
}

export default class PageWithLayout extends React.Component<PageWithLayoutProps> {
	public render() {
		const Layout = this.props.layout

		if (Layout) {
			return <Layout>{this.props.children}</Layout>
		}
		return <LayoutContext.Consumer>{Layout => <Layout>{this.props.children}</Layout>}</LayoutContext.Consumer>
	}
}
