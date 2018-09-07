import * as React from 'react'
import PageLink, { PageLinkProps } from '../pageRouting/PageLink'
import { Icon } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'
import classNames from 'classnames'

export default class MenuPageLink extends React.Component<MenuPageLinkProps> {
	render() {
		return (
			<PageLink
				Component={props => (
					<li className="menu-list-item">
						<a {...props} className={classNames('menu-list-item-link', this.props.appearance)}>
							{this.props.frontIcon && (
								<div className="icon icon-left">
									<Icon icon={this.props.frontIcon} iconSize={18} />
								</div>
							)}

							{this.props.children}
						</a>
					</li>
				)}
				change={this.props.change}
			/>
		)
	}
}

export enum LinkAppearance {
	Primary = 'view-primary'
}

export interface MenuPageLinkProps {
	appearance?: LinkAppearance
	frontIcon?: IconName
	change: PageLinkProps<any>['change']
}
