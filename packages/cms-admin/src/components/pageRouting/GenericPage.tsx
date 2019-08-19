import * as React from 'react'
import { LayoutInner } from '../LayoutInner'

interface GenericPageProps {
	pageName: string
}

export class GenericPage extends React.Component<GenericPageProps> {
	static getPageName(props: GenericPageProps) {
		return props.pageName
	}

	render(): React.ReactNode {
		return <LayoutInner>{this.props.children}</LayoutInner>
	}
}
