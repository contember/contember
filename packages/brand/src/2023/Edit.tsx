import { useExpectSameValueReference } from '@contember/react-utils'
import { listClassName, svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Edit = memo<ContemberIdentitySvgProps>(({
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
			className={listClassName(['cui-brand-icon', 'cui-brand-edit', className])}
			fill="none"
			style={useMemo(() => ({ ...style, '--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<path d="m23.4358 47.8008-3.8475-21.9811 30.6362-6.5978-5.0683 32.3127z" stroke={color} strokeWidth={strokeWidth} />
		</svg>
	)
})
