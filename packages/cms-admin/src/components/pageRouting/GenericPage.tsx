import * as React from 'react'
import PageWithLayout from './PageWithLayout'

interface GenericPageProps {
	pageName: string
	layout?: React.ComponentType<{ children?: React.ReactNode }>
}

export default class GenericPage extends React.Component<GenericPageProps> {
	static getPageName(props: GenericPageProps) {
		return props.pageName
	}

	render(): React.ReactNode {
		return <PageWithLayout layout={this.props.layout}>{this.props.children}</PageWithLayout>
	}
}
