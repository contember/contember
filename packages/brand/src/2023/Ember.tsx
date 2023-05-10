import { useExpectSameValueReference } from '@contember/react-utils'
import { listClassName, svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Ember = memo<ContemberIdentitySvgProps>(({
	className,
	color = 'currentColor',
	crop = 10,
	height = 70,
	scale,
	strokeWidth = 6,
	style,
	width = 70,
	...rest
}) => {
	useExpectSameValueReference(style)

	if (import.meta.env.DEV) {
		const exhaustiveCheck: Record<PropertyKey, never> = rest
	}

	return (
		<svg
			className={listClassName(['cui-brand-icon', 'cui-brand-ember', className])}
			style={useMemo(() => ({ ...style, '--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<g fill="none" fillRule="evenodd">
				<path d="m29.2354 23.3015 14.75647 14.75647-14.5200135 14.5200135-14.75647-14.75647z" stroke={color} strokeWidth={strokeWidth} />
				<path d="m58.4769 17.7512-9.2835-9.0941-9.2836 9.0941 9.2836 9.094z" fill={color} fillRule="nonzero" />
			</g>
		</svg>
	)
})
Ember.displayName = 'Ember'
