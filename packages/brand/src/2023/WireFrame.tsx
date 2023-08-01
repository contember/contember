import { useClassName, useExpectSameValueReference } from '@contember/react-utils'
import { svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const WireFrame = memo<ContemberIdentitySvgProps>(({
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
			className={useClassName(['brand-icon', 'brand-wire-frame'], className)}
			style={useMemo(() => ({ ...style, '--cui-icon--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<g fill="none" fillRule="evenodd">
				<path d="m42.29424 12.224871h16.2856v46.563224h-16.2856z" stroke={color} strokeWidth={strokeWidth} />
				<path d="m13.4716 12.224871h16.88688v17.105245h-16.88688z" stroke={color} strokeWidth={strokeWidth} />
				<path d="m12.587504 39.697748h18.65376v18.894972h-18.65376z" fill={color} fillRule="nonzero" />
			</g>
		</svg>
	)
})
WireFrame.displayName = 'WireFrame'
