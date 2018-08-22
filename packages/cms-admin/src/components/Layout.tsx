import * as React from 'react'

export interface LayoutProps {
	header: React.ReactNode,
	navbar: {
		left: React.ReactNode,
		center: React.ReactNode,
		right: React.ReactNode,
	},
	side: React.ReactNode,
	content: React.ReactNode,
	asideContent: React.ReactNode,
}

export default class Layout extends React.Component<LayoutProps> {
	render() {
		return (
			<>
				<header>
					{this.props.header}

					<nav className="d-flex justify-content-between">
						<div>{this.props.navbar.left}</div>
						<div>{this.props.navbar.center}</div>
						<div>{this.props.navbar.right}</div>
					</nav>
				</header>

				{this.props.side && (
					<aside>{this.props.side}</aside>
				)}

				<main>{this.props.content}</main>

				{this.props.asideContent && (
					<aside>{this.props.asideContent}</aside>
				)}
			</>
		)
	}
}
