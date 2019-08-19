import * as React from 'react'

interface GenericPageProps {
	pageName: string
}

export class GenericPage extends React.Component<GenericPageProps> {
	static getPageName(props: GenericPageProps) {
		return props.pageName
	}

	render(): React.ReactNode {
		return this.props.children
	}
}
