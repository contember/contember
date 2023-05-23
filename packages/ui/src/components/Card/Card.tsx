import classNames from 'classnames'
import { memo, MouseEvent, ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { HTMLAnchorElementProps, HTMLDivElementProps } from '../../types'
import { toEnumViewClass, toFeatureClass, toStateClass } from '../../utils'
import { useInputClassName, VisuallyDependentControlProps } from '../Forms'
import { Label } from '../Typography'

const CardInner = ({
	className,
	children,
	src,
}: {
	className: string,
	children: ReactNode,
	src?: string | null,
}) => (
	<div className={`${className}-inner`}>
		<div
			className={`${className}-thumbnail`}
			style={{ backgroundImage: src ? `url('${encodeURI(src)}')` : undefined }}
		/>
		{children && <div className={`${className}-content`}>
			<Label>{children}</Label>
		</div>}
	</div>
)

export interface LinkCompatibleProps {
	active: boolean
	href: string
	onClick: (e?: MouseEvent<HTMLAnchorElement>) => void
}

export type CommonCardProps =
	& VisuallyDependentControlProps
	& {
		active?: boolean
		// onRemove?: () => void // TODO: Implement when Actionable box is enhanced
		// onEdit?: () => void // TODO: Implement when Actionable box is enhanced
		src?: string | null
		children?: ReactNode
		layout?: 'label-below' | 'label-inside'
	}

export type CardProps =
	& Omit<CommonCardProps, 'type'>
	& Omit<HTMLDivElementProps, 'onClick'>
	& {
		href?: never
		onClick?: () => void
	}

export type LinkCardProps =
	& Omit<CommonCardProps, 'active' | 'type'>
	& Omit<HTMLAnchorElementProps, 'href' | 'onClick'>
	& LinkCompatibleProps

/**
 * @group UI
 */
export const LinkCard = memo<LinkCardProps>(
	({
		active,
		children,
		className: _className,
		layout = 'label-below',
		src,
		...props
	}) => {
		const componentClassName = useComponentClassName('card')
		const className = classNames(
			componentClassName,
			toEnumViewClass(layout),
			toFeatureClass('focus', true),
			toFeatureClass('hover', true),
			toFeatureClass('press', true),
			toStateClass('active', active),
			useInputClassName(props as VisuallyDependentControlProps),
			_className,
		)

		return (
			<a {...props} className={className}>
				<CardInner src={src} className={componentClassName}>{children}</CardInner>
			</a>
		)
	},
)
LinkCard.displayName = 'LinkCard'

/**
 * @group UI
 */
export const Card = memo<CardProps>(
	({
		children,
		className: _className,
		layout = 'label-below',
		onClick,
		active,
		src,
		...props
	}) => {
		const componentClassName = useComponentClassName('card')
		const className = classNames(
			componentClassName,
			toEnumViewClass(layout),
			toFeatureClass('focus', !!onClick),
			toFeatureClass('hover', !!onClick),
			toFeatureClass('press', !!onClick),
			toStateClass('active', active),
			useInputClassName(props as VisuallyDependentControlProps),
			_className,
		)

		return (
			<div {...props} onClick={onClick} className={className}>
				<CardInner src={src} className={componentClassName}>{children}</CardInner>
			</div>
		)
	},
)
Card.displayName = 'Card'
