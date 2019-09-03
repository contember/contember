import * as React from 'react'
import cn from 'classnames'
import { ProjectUserRolesRevealer, TokenExposer } from './Dev'
import LogoutLink from './LogoutLink'
import { Avatar, AvatarSize } from './ui'
import { Icon } from '@blueprintjs/core'
import { default as PageLink } from './pageRouting/PageLink'
import { useSelector } from 'react-redux'
import State from '../state'
import { Aether, Button, ButtonGroup, Dropdown, DropdownContentContainerProvider, forceReflow } from '@contember/ui'
import SwitchProjectLink from './SwitchProjectLink'

export interface LayoutProps {
	header: {
		title?: React.ReactNode
		left: React.ReactNode
		center?: React.ReactNode
		right: React.ReactNode
	}
	side: React.ReactNode
	content: React.ReactNode
}

export const LayoutDefault = React.memo((props: LayoutProps) => {
	const [isMenuOpen, setIsMenuOpen] = React.useState(false)
	const email = useSelector<State, string | undefined>(state =>
		state.auth.identity ? state.auth.identity.email : undefined,
	)
	const sideRef = React.useRef<HTMLElement>(null)

	const toggleMenu = React.useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault()
			setIsMenuOpen(!isMenuOpen)

			const el = sideRef.current
			if (el) {
				forceReflow(el)
				let executed = false
				el.addEventListener(
					'transitionend',
					() => {
						if (!executed) {
							el.scrollTo(0, 0)
							executed = true
						}
					},
					{ once: true },
				)
			}
		},
		[isMenuOpen, sideRef],
	)

	return (
		<Aether className="layout">
			<header className="layout-navbar">
				<div className="navbar-left">
					{props.side && (
						<button className="layout-menuBtn" onClick={toggleMenu}>
							<Icon icon="menu" />
						</button>
					)}
					{props.header.title && (
						<PageLink to="dashboard" className="navbar-title">
							{props.header.title}
						</PageLink>
					)}
					<DropdownContentContainerProvider>{props.header.left}</DropdownContentContainerProvider>
					{<TokenExposer />}
					{<ProjectUserRolesRevealer />}
				</div>
				<div className="navbar-center">{props.header.center}</div>
				<div className="navbar-right">
					{props.header.right}
					<DropdownContentContainerProvider>
						<Dropdown
							alignment="end"
							buttonProps={{
								size: 'large',
								distinction: 'seamless',
								flow: 'circular',
								children: <Avatar size={AvatarSize.Size2} email={email} />,
							}}
						>
							<ButtonGroup orientation="vertical">
								<SwitchProjectLink
									Component={({ onClick, href }) => (
										<Button distinction="seamless" flow="block" onClick={onClick} href={href} Component="a">
											Switch project
										</Button>
									)}
								/>
								<LogoutLink
									Component={props => (
										<Button distinction="seamless" flow="block" {...props}>
											Sign Out
										</Button>
									)}
								/>
							</ButtonGroup>
						</Dropdown>
					</DropdownContentContainerProvider>
				</div>
			</header>

			<div className={cn('layout-container', isMenuOpen && 'layout-menuOpen')}>
				{props.side && (
					<>
						<div className="layout-menuShadow" onClick={toggleMenu} />
						<aside className="layout-side" ref={sideRef}>
							{props.side}
						</aside>
					</>
				)}

				<main className="layout-content">{props.content}</main>
			</div>
		</Aether>
	)
})
LayoutDefault.displayName = 'LayoutDefault'
