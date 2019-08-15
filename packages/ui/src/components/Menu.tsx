import * as React from 'react'
import { Collapsible } from './Collapsible'
import { Navigation } from '../Navigation'
import cn from 'classnames'

const DepthContext = React.createContext(0)

function Menu(props: Menu.Props) {
	return (
		<DepthContext.Provider value={0}>
			<section className="menu">
				<ul className="menu-list">{props.children}</ul>
			</section>
		</DepthContext.Provider>
	)
}

namespace Menu {
	export interface Props {
		children?: React.ReactNode
	}

	export interface ItemProps {
		children?: React.ReactNode
		title?: string | React.ReactNode
		to?: Navigation.MiddlewareProps['to']
	}

	interface TitleProps {
		children?: React.ReactNode
		className?: string
	}

	type TitleOptions =
		| {
				onClick?: never
				to?: never
		  }
		| {
				to: Navigation.MiddlewareProps['to'] | undefined
				onClick?: never
		  }
		| {
				onClick: () => void
				to?: never
		  }

	function ItemContent(props: ItemProps) {
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
		const { to, onClick } = options

		if (to) {
			return (props: TitleProps) => {
				const { children, ...otherProps } = props
				return (
					<Link to={to} {...otherProps}>
						{children}
					</Link>
				)
			}
		} else if (onClick) {
			return (props: TitleProps) => {
				const { children, ...otherProps } = props
				return (
					<button type="button" onClick={onClick} {...otherProps}>
						{children}
					</button>
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

	function ItemWrapper(props: { children?: React.ReactNode; className: string; to: ItemProps['to'] }) {
		return (
			<IsActive to={props.to}>
				{isActive => <li className={cn(props.className, isActive && 'is-active')}>{props.children}</li>}
			</IsActive>
		)
	}

	function GroupItem(props: ItemProps) {
		const Title = useTitle({ to: props.to })
		return (
			<ItemWrapper className={cn('menu-group')} to={props.to}>
				{props.title && <Title className="menu-group-title">{props.title}</Title>}
				{props.children && <ul className="menu-group-list">{props.children}</ul>}
			</ItemWrapper>
		)
	}

	function SubGroupItem(props: ItemProps) {
		let options: TitleOptions = {}

		if (props.children) {
			options = { onClick: () => setExpanded(!expanded) }
		} else if (props.to) {
			options = { to: props.to }
		}
		const Title = useTitle(options)
		const [expanded, setExpanded] = React.useState(false)

		return (
			<ItemWrapper
				className={cn('menu-subgroup', props.children && (expanded ? 'is-expanded' : 'is-collapsed'))}
				to={props.to}
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
		const Title = useTitle({ to: props.to })
		return (
			<ItemWrapper className="menu-action" to={props.to}>
				{props.title && <Title className="menu-action-title">{props.title}</Title>}
				{props.children && <ul className="menu-action-list">{props.children}</ul>}
			</ItemWrapper>
		)
	}

	function TooDeepItem(props: ItemProps) {
		return (
			<ItemWrapper className="menu-tooDeep" to={props.to}>
				{props.title && <h4 className="menu-tooDeep-title">{props.title}</h4>}
				{props.children && <ul className="menu-tooDeep-list">{props.children}</ul>}
			</ItemWrapper>
		)
	}

	export function Item(props: ItemProps) {
		const depth = React.useContext(DepthContext)

		return (
			<DepthContext.Provider value={depth + 1}>
				<ItemContent {...props} />
			</DepthContext.Provider>
		)
	}
}

export { Menu }
