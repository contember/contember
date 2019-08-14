import * as React from 'react'
import { Collapsible } from './Collapsible'
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
		change?: any
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

	function GroupItem(props: ItemProps) {
		return (
			<section className={cn('menu-group', props.active && 'is-active')}>
				{props.title && <h1 className="menu-group-title">{props.title}</h1>}
				{props.children && <ul className="menu-group-list">{props.children}</ul>}
			</section>
		)
	}

	function SubGroupItem(props: ItemProps) {
		const [expanded, setExpanded] = React.useState(props.active || false)

		return (
			<li className={cn('menu-subgroup', props.active && 'is-active')}>
				{props.title && (
					<h2 className="menu-subgroup-title" onClick={() => setExpanded(!expanded)}>
						{props.title}
					</h2>
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
		return (
			<li className={cn('menu-action', props.active && 'is-active')}>
				{props.title && <h3 className="menu-action-title">{props.title}</h3>}
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
