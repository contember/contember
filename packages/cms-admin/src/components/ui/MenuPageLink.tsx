import * as React from 'react'
import PageLink, { PageLinkProps } from '../pageRouting/PageLink'

export default class MenuPageLink extends React.Component<MenuPageLinkProps> {
	render() {
		return (
			<PageLink
				Component={props => (
					<li className="menuSecondaryItem">
						<a {...props} className="menuSecondaryItem-link">
							{this.props.children}
						</a>
					</li>
				)}
				change={this.props.change}
			/>
		)
	}
}

export interface MenuPageLinkProps {
	change: PageLinkProps<any>['change']
}
