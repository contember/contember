import * as React from 'react'
import { Collapsible } from './Collapsible'
import { Navigation } from './../Navigation'
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
		active?: boolean
		target?: Navigation.MiddlewareProps['target']
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

	function useTitle(target: ItemProps['target'], defaultComponent: string = 'div') {
		const Link = React.useContext(Navigation.MiddlewareContext)

		const Wrap = target ? Link : defaultComponent

		/* any => other HTML[Anchor]Element props*/
		return function Title(props: { children?: React.ReactNode } | any) {
			const { children, ...wrapProps } = props
			return (
				<Wrap target={target!} {...wrapProps}>
					{children}
				</Wrap>
			)
		}
	}

	function GroupItem(props: ItemProps) {
		const Title = useTitle(props.target)
		return (
			<section className={cn('menu-group', props.active && 'is-active')}>
				{props.title && <Title className="menu-group-title">{props.title}</Title>}
				{props.children && <ul className="menu-group-list">{props.children}</ul>}
			</section>
		)
	}

	function SubGroupItem(props: ItemProps) {
		const Title = useTitle(props.target, props.children ? 'button' : 'div')
		const [expanded, setExpanded] = React.useState(props.active || false)

		return (
			<li
				className={cn(
					'menu-subgroup',
					props.active && 'is-active',
					props.children && (expanded ? 'is-expanded' : 'is-collapsed'),
				)}
			>
				{props.title && (
					<Title
						className="menu-subgroup-title"
						onClick={props.children ? () => setExpanded(!expanded) : undefined}
						type={props.children && 'button'}
					>
						{props.title}
					</Title>
				)}
				{props.children && (
					<Collapsible expanded={expanded}>
						<ul className="menu-subgroup-list">{props.children}</ul>
					</Collapsible>
				)}
			</li>
		)
	}

	function ActionItem(props: ItemProps) {
		const Title = useTitle(props.target)
		return (
			<li className={cn('menu-action', props.active && 'is-active')}>
				{props.title && <Title className="menu-action-title">{props.title}</Title>}
				{props.children && <ul className="menu-action-list">{props.children}</ul>}
			</li>
		)
	}

	function TooDeepItem(props: ItemProps) {
		return (
			<li className={cn('menu-tooDeep', props.active && 'is-active')}>
				{props.title && <h4 className="menu-tooDeep-title">{props.title}</h4>}
				{props.children && <ul className="menu-tooDeep-list">{props.children}</ul>}
			</li>
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
