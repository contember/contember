import * as React from 'react'
import PageLink, { PageLinkProps } from '../pageRouting/PageLink'
import { Avatar, AvatarShape, AvatarSize } from './Avatar'

export interface MenuPageLinkPrimaryProps {
	avatar: React.ReactNode
	name: React.ReactNode
	note?: React.ReactNode
	change: PageLinkProps<any>['change']
}

export class MenuPageLinkPrimary extends React.PureComponent<MenuPageLinkPrimaryProps> {
	render() {
		const { avatar, name, note } = this.props
		return (
			<PageLink
				Component={props => (
					<li className="menuPrimaryItem">
						<a {...props} className="menuPrimaryItem-link">
							<Avatar shape={AvatarShape.Square} size={AvatarSize.Size2}>
								{avatar}
							</Avatar>
							<div className="menuPrimaryItem-texts">
								<div className="menuPrimaryItem-name">{name}</div>
								{note && <div className="menuPrimaryItem-note">{note}</div>}
							</div>
						</a>
					</li>
				)}
				change={this.props.change}
			/>
		)
	}
}
