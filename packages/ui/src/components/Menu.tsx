import * as React from 'react'
import { Collapsible } from './Collapsible'
import { Navigation } from '../Navigation'
import cn from 'classnames'

const DepthContext = React.createContext(0)

class Menu extends React.PureComponent<Menu.Props> {
	public static displayName = 'Menu'

	public render() {
		return (
			<DepthContext.Provider value={0}>
				<section className="menu">
					<ul className="menu-list">{this.props.children}</ul>
				</section>
			</DepthContext.Provider>
		)
	}
}

namespace Menu {
	export interface Props {
		children?: React.ReactNode
	}

	export interface ItemProps {
		children?: React.ReactNode
		title?: string | React.ReactNode
		to?: Navigation.MiddlewareProps['to']
		external?: boolean
	}

	interface TitleProps {
		children?: React.ReactNode
		className?: string
	}

	type TitleOptions =
		| {
				onClick?: never
				to?: never
				external?: never
		  }
		| {
				onClick?: () => void
				to?: Navigation.MiddlewareProps['to']
				external?: ItemProps['external']
		  }

	function DepthSpecificItem(props: ItemProps) {
		const depth = React.useContext(DepthContext)

		if (depth === 1) {
			return <GroupItem {...props} />
		} else if (depth === 2) {
			return <SubGroupItem {...props} />
		} else if (depth === 3) {
			return <ActionItem {...props} />
		} else {
			return <TooDeepItem {...props} />
		}
	}

	function useTitle(options: TitleOptions) {
		const Link = React.useContext(Navigation.MiddlewareContext)
		const { to, external, onClick } = options

		if (onClick) {
			return (props: TitleProps) => {
				const { children, ...otherProps } = props
				if (to) {
					return (
						<Link
							to={to}
							Component={({ navigate }) => (
								<button
									type="button"
									onClick={() => {
										onClick()
										navigate()
									}}
									{...otherProps}
								>
									<div className="menu-titleContent">{children}</div>
								</button>
							)}
						/>
					)
				}
				return (
					<button type="button" onClick={onClick} {...otherProps}>
						<div className="menu-titleContent">{children}</div>
					</button>
				)
			}
		} else if (to) {
			return (props: TitleProps) => {
				const { children, ...otherProps } = props
				return (
					<Link to={to} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...otherProps}>
						{children}
					</Link>
				)
			}
		} else {
			return (props: TitleProps) => {
				const { children, ...otherProps } = props
				return <div {...otherProps}>{children}</div>
			}
		}
	}

	function IsActive(props: { children: (isActive: boolean) => void; to: ItemProps['to'] }) {
		const Link = React.useContext(Navigation.MiddlewareContext)

		if (props.to) {
			return (
				<Link
					to={props.to}
					Component={innerProps => {
						return <>{props.children(innerProps.isActive)}</>
					}}
				/>
			)
		} else {
			return <>{props.children(false)}</>
		}
	}

	function ItemWrapper(props: {
		children?: React.ReactNode
		className: string
		to: ItemProps['to']
		suppressIsActive?: boolean
	}) {
		return (
			<IsActive to={props.to}>
				{isActive => (
					<li className={cn(props.className, isActive && !props.suppressIsActive && 'is-active')}>{props.children}</li>
				)}
			</IsActive>
		)
	}

	function GroupItem(props: ItemProps) {
		const Title = useTitle({ to: props.to, external: props.external })
		return (
			<ItemWrapper className="menu-group" to={props.to}>
				{props.title && <Title className="menu-group-title">{props.title}</Title>}
				{props.children && <ul className="menu-group-list">{props.children}</ul>}
			</ItemWrapper>
		)
	}

	function SubGroupItem(props: ItemProps) {
		const [expanded, setExpanded] = React.useState(false)
		const onClick = React.useCallback(() => {
			setExpanded(!expanded)
		}, [setExpanded, expanded])
		const options: TitleOptions = {
			onClick: props.children ? onClick : undefined,
		}
		if (!expanded) {
			options.to = props.to
			options.external = props.external
		}
		const Title = useTitle(options)

		return (
			<ItemWrapper
				className={cn('menu-subgroup', props.children && (expanded ? 'is-expanded' : 'is-collapsed'))}
				to={props.to}
				suppressIsActive={!!props.children}
			>
				{props.title && <Title className="menu-subgroup-title">{props.title}</Title>}
				{props.children && (
					<Collapsible expanded={expanded}>
						<ul className="menu-subgroup-list">{props.children}</ul>
					</Collapsible>
				)}
			</ItemWrapper>
		)
	}

	function ActionItem(props: ItemProps) {
		const Title = useTitle({ to: props.to, external: props.external })
		return (
			<ItemWrapper className="menu-action" to={props.to}>
				{props.title && <Title className="menu-action-title">{props.title}</Title>}
				{props.children && <ul className="menu-action-list">{props.children}</ul>}
			</ItemWrapper>
		)
	}

	function TooDeepItem(props: ItemProps) {
		const Title = useTitle({ to: props.to, external: props.external })
		return (
			<ItemWrapper className="menu-tooDeep" to={props.to}>
				{props.title && <Title className="menu-tooDeep-title">{props.title}</Title>}
				{props.children && <ul className="menu-tooDeep-list">{props.children}</ul>}
			</ItemWrapper>
		)
	}

	export function Item(props: ItemProps) {
		const depth = React.useContext(DepthContext)

		return (
			<DepthContext.Provider value={depth + 1}>
				<DepthSpecificItem {...props} />
			</DepthContext.Provider>
		)
	}
}

export { Menu }
