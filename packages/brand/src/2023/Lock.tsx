import { useClassName, useExpectSameValueReference } from '@contember/react-utils'
import { svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Lock = memo<ContemberIdentitySvgProps>(({
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
			className={useClassName(['brand-icon', 'brand-lock'], className)}
			fill="none"
			style={useMemo(() => ({ ...style, '--cui-icon--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<g stroke={color} strokeWidth={strokeWidth}>
				<path d="m18.2871 30.1372h27.2804v26.2165h-27.2804z" />
				<path d="m40.4316 25.3582c0-8.5437 0 .1139 0-4.2958s2.9524-7.4989 7.1853-7.4989 6.8076 2.6206 6.8076 6.8098v4.9849" />
			</g>
		</svg>
	)
})
Lock.displayName = 'Lock'
