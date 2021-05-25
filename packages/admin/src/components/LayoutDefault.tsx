import {
	Aether,
	Button,
	ButtonGroup,
	Dropdown,
	DropdownContentContainerProvider,
	forceReflow,
	Heading,
	Icon,
} from '@contember/ui'
import cn from 'classnames'
import { memo, MouseEvent as ReactMouseEvent, ReactNode, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type State from '../state'
import { ProjectUserRolesRevealer, TokenExposer } from './Dev'
import LogoutLink from './LogoutLink'
import { default as PageLink } from './pageRouting/PageLink'
import SwitchProjectLink from './SwitchProjectLink'
import { Avatar } from './ui'

export interface LayoutProps {
	header: {
		title?: ReactNode
		left: ReactNode
		center?: ReactNode
		right: ReactNode
	}
	side: ReactNode
	content: ReactNode
	userMenu?: ReactNode
}

export const LayoutDefault = memo((props: LayoutProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const email = useSelector<State, string | undefined>(state =>
		state.auth.identity ? state.auth.identity.email : undefined,
	)
	const sideRef = useRef<HTMLElement>(null)

	const toggleMenu = useCallback(
		(event: ReactMouseEvent) => {
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
							<Icon blueprintIcon="menu" />
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
								children: <Avatar size={2} email={email} />,
							}}
						>
							<>
								<Heading size="small" depth={3} style={{ padding: '.5em', textAlign: 'center' }}>
									{email}
								</Heading>
								<ButtonGroup orientation="vertical" flow="block">
									{props.userMenu}
									<SwitchProjectLink
										Component={({ onClick, href }) => (
											<Button distinction="seamless" flow="generousBlock" onClick={onClick} href={href} Component="a">
												Switch project
											</Button>
										)}
									/>
									<LogoutLink
										Component={props => (
											<Button distinction="seamless" flow="generousBlock" {...props}>
												Sign Out
											</Button>
										)}
									/>
								</ButtonGroup>
							</>
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
