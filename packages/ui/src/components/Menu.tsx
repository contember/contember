import classNames from 'classnames'
import {
	createContext,
	MouseEvent as ReactMouseEvent,
	PureComponent,
	ReactNode,
	useCallback,
	useContext,
	useState,
} from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { GlobalClassNamePrefixContext } from '../contexts'
import { useNavigationLink } from '../Navigation'
import { isSpecialLinkClick, toViewClass } from '../utils'
import { Collapsible } from './Collapsible'
import { Label, LabelProps } from './Typography'

const DepthContext = createContext(0)

class Menu extends PureComponent<Menu.Props> {
	public static displayName = 'Menu'

	public override render() {
		return (
			<DepthContext.Provider value={0}>
				<GlobalClassNamePrefixContext.Consumer>
					{prefix => (
						<section className={classNames(`${prefix}menu`, toViewClass('showCaret', this.props.showCaret ?? true))}>
							<ul className={`${prefix}menu-list`}>{this.props.children}</ul>
						</section>
					)}
				</GlobalClassNamePrefixContext.Consumer>
			</DepthContext.Provider>
		)
	}
}

namespace Menu {
	export interface Props {
		children?: ReactNode
		showCaret?: boolean
	}

	export interface ItemProps<T extends any = any> {
		children?: ReactNode
		title?: string | ReactNode
		to?: T
		href?: string
		external?: boolean
		expandedByDefault?: boolean
	}

	type TitleProps = {
		children?: ReactNode
		className?: string
	} & Omit<LabelProps, 'children'> & (
		  {
				onClick?: never
				href?: never
				external?: never
				suppressTo?: never
		  }
		| {
				onClick?: (e: ReactMouseEvent<HTMLElement>) => void
				href?: string
				external?: boolean
				suppressTo?: boolean
		  }

	)

	function DepthSpecificItem(props: ItemProps) {
		const depth = useContext(DepthContext)

		if (depth === 1) {
			return <GroupItem {...props} />
		} else if (depth === 2) {
			return <SubGroupItem {...props} />
		} else if (depth === 3 || depth === 4) {
			return <ActionItem {...props} />
		} else {
			return <TooDeepItem {...props} />
		}
	}

	function Title(props: TitleProps) {
		const { children, external, suppressTo, onClick, ...otherProps } = props
		const content = <Label size={otherProps.size} isActive={otherProps.isActive}>{children}</Label>
		if (otherProps.href) {
			return <a
				href={otherProps.href}
				{...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
				onClick={event => {
					if (onClick && !isSpecialLinkClick(event.nativeEvent)) {
						onClick(event)
						if (suppressTo) {
							event.preventDefault()
						}
					}
				}}
				{...otherProps}
			>{content}</a>
		} else if (onClick) {
			return (
				<button type="button" onClick={onClick} {...otherProps}>
					{content}
				</button>
			)
		} else {
			return <div {...otherProps}>{content}</div>
		}
	}

	function ItemWrapper(props: {
		children?: ReactNode
		className: string
		isActive?: boolean
	}) {
		return <li className={classNames(props.className, props.isActive && 'is-active')}>{props.children}</li>
	}

	function GroupItem(props: ItemProps) {
		const { isActive, href, navigate } = useNavigationLink(props.to, props.href)
		const prefix = useClassNamePrefix()
		return (
			<ItemWrapper className={`${prefix}menu-group`} isActive={isActive}>
				{props.title && <Title href={href} onClick={navigate} size="small" className={`${prefix}menu-group-title`}>{props.title}</Title>}
				{props.children && <ul className={`${prefix}menu-group-list`}>{props.children}</ul>}
			</ItemWrapper>
		)
	}

	function SubGroupItem(props: ItemProps) {
		const [expanded, setExpanded] = useState(!!props.expandedByDefault)
		const { isActive, href, navigate } = useNavigationLink(props.to, props.href)
		const onClick = useCallback((e: ReactMouseEvent) => {
			setExpanded(!expanded)
			navigate?.(e)
		}, [setExpanded, expanded, navigate])
		const options: TitleProps = {
			isActive,
			onClick: onClick,
			external: props.external,
			suppressTo: expanded,
			href,
		}
		const prefix = useClassNamePrefix()
		const expandedClass = props.children && (expanded ? 'is-expanded' : 'is-collapsed')

		return (
			<ItemWrapper
				className={classNames(
					`${prefix}menu-subgroup`,
					expandedClass,
				)}
				isActive={isActive && !props.children}
			>
				{props.title && <Title {...options} className={classNames(
					`${prefix}menu-subgroup-title`,
					props.children ? 'has-children' : undefined,
					expandedClass,
				)}>{props.title}</Title>}
				{props.children && (
					<Collapsible expanded={expanded}>
						<ul className={`${prefix}menu-subgroup-list`}>{props.children}</ul>
					</Collapsible>
				)}
			</ItemWrapper>
		)
	}

	function ActionItem(props: ItemProps) {
		const { isActive, href, navigate } = useNavigationLink(props.to, props.href)
		const prefix = useClassNamePrefix()
		return (
			<ItemWrapper className={`${prefix}menu-action`} isActive={isActive}>
				{props.title && <Title isActive={isActive} href={href} onClick={navigate} external={props.external} className={classNames(
					`${prefix}menu-action-title`,
					props.children ? 'has-children' : undefined,
					props.children ? 'is-expanded' : undefined,
				)}>{props.title}</Title>}
				{props.children && <ul className={`${prefix}menu-action-list`}>{props.children}</ul>}
			</ItemWrapper>
		)
	}

	function TooDeepItem(props: ItemProps) {
		const { isActive, href, navigate } = useNavigationLink(props.to, props.href)
		const prefix = useClassNamePrefix()
		return (
			<ItemWrapper className={`${prefix}menu-tooDeep`} isActive={isActive}>
				{props.title && <Title isActive={isActive} href={href} onClick={navigate} external={props.external}  className={classNames(
					`${prefix}menu-tooDeep-title`,
					props.children ? 'has-children' : undefined,
					props.children ? 'is-expanded' : undefined,
				)}>{props.title}</Title>}
				{props.children && <ul className={`${prefix}menu-tooDeep-list`}>{props.children}</ul>}
			</ItemWrapper>
		)
	}

	export function Item(props: ItemProps) {
		const depth = useContext(DepthContext)

		return (
			<DepthContext.Provider value={depth + 1}>
				<DepthSpecificItem {...props} />
			</DepthContext.Provider>
		)
	}
}

export { Menu }
