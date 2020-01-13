import { LayoutDefault, PageLinkButton } from '@contember/admin'
import * as React from 'react'
import { SideMenu } from './SideMenu'

interface LayoutProps {}

export class Layout extends React.PureComponent<LayoutProps> {
	render() {
		return (
			<LayoutDefault
				header={{
					title: <>Sandbox</>,
					left: false,
					right: false,
				}}
				side={<SideMenu />}
				content={this.props.children}
			/>
		)
	}
}
