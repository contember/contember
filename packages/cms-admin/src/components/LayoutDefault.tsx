import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import Link from './Link'
import LogoutLink from './LogoutLink'

export interface LayoutDefaultProps {
	header: {
		left: React.ReactNode
		right: React.ReactNode
	}
	side: React.ReactNode
	content: React.ReactNode
}

export default class LayoutDefault extends React.Component<LayoutDefaultProps> {
	render() {
		return (
			<>
				<header className="layout-navbar">
					<div>{this.props.header.left}</div>
					<div>
						{this.props.header.right}
						<Link
							requestChange={() => ({ name: 'login' })}
							Component={props => (
								<a {...props} className="link link-navbar">
									Honza Sládek
								</a>
							)}
						/>
						<LogoutLink
							Component={props => (
								<a {...props} className="link link-navbar">
									<div className="icon icon-right">
										<Icon icon={IconNames.LOG_OUT} />
									</div>
								</a>
							)}
						/>
					</div>
				</header>

				<div className="layout-container">
					{this.props.side && <aside className="layout-side">{this.props.side}</aside>}

					<main className="layout-content">{this.props.content}</main>
				</div>
			</>
		)
	}
}
