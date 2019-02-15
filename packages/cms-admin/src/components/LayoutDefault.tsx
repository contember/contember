import * as React from 'react'
import cn from 'classnames'
import LogoutLink from './LogoutLink'
import { Avatar, AvatarSize } from './ui/Avatar'
import { Icon } from '@blueprintjs/core'
import { default as PageLink } from './pageRouting/PageLink'

export interface LayoutDefaultProps {
	header: {
		title?: React.ReactNode
		left: React.ReactNode
		center?: React.ReactNode
		right: React.ReactNode
	}
	side: React.ReactNode
	content: React.ReactNode
}

interface LayoutDefaultState {
	menuOpen: boolean
}

export default class LayoutDefault extends React.PureComponent<LayoutDefaultProps, LayoutDefaultState> {
	state: LayoutDefaultState = {
		menuOpen: false
	}

	private sideRef = React.createRef<HTMLElement>()

	toggleMenu = (event: React.MouseEvent) => {
		event.preventDefault()
		this.setState(
			state => ({ ...state, menuOpen: !state.menuOpen }),
			() => {
				const el = this.sideRef.current
				if (el) {
					let executed = false
					el.addEventListener(
						'transitionend',
						() => {
							if (!executed) {
								el.scrollTo(0, 0)
								executed = true
							}
						},
						{ once: true }
					)
				}
			}
		)
	}

	render() {
		return (
			<>
				<header className="layout-navbar">
					<div className="navbar-left">
						{this.props.side && (
							<button className="layout-menuBtn" onClick={this.toggleMenu}>
								<Icon icon="menu" />
							</button>
						)}
						{this.props.header.title && (
							<PageLink
								change={() => ({ name: 'dashboard' })}
								Component={props => (
									<a {...props} className="navbar-title">
										{this.props.header.title}
									</a>
								)}
							/>
						)}
						{this.props.header.left}
					</div>
					<div className="navbar-center">{this.props.header.center}</div>
					<div className="navbar-right">
						{this.props.header.right}
						<LogoutLink
							Component={props => (
								<a {...props} className="navbar-link">
									<Avatar size={AvatarSize.Size2}>HS</Avatar>
								</a>
							)}
						/>
					</div>
				</header>

				<div className={cn('layout-container', this.state.menuOpen && 'layout-menuOpen')}>
					{this.props.side && (
						<>
							<div className="layout-menuShadow" onClick={this.toggleMenu} />
							<aside className="layout-side" ref={this.sideRef}>
								{this.props.side}
							</aside>
						</>
					)}

					<main className="layout-content">{this.props.content}</main>
				</div>
			</>
		)
	}
}
