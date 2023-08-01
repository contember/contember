import { useClassName, useExpectSameValueReference } from '@contember/react-utils'
import { svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Contember = memo<Omit<ContemberIdentitySvgProps, 'strokeWidth'>>(({
	className,
	color = 'currentColor',
	crop = 10,
	height = 70,
	scale,
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
			className={useClassName(['brand-icon', 'brand-contember'], className)}
			fill="none"
			style={useMemo(() => ({ ...style, '--cui-icon--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<path d="m54.0381 37.6188-3.308-2.6764-4.2381 3.4731c-3.263 2.6763-6.2034 5.7549-8.7538 9.1583l-2.4978 3.3416-2.5954-3.4112c-2.7979-3.6819-6.0158-7.0002-9.5863-9.8854l-3.308-2.6764 1.9653-1.5857c4.4631-3.6045 8.4837-7.7505 11.9792-12.3529l1.5377-2.0265 1.1927 1.5624c3.728 4.9041 8.0186 9.3285 12.7818 13.1806l1.5152 1.2299 1.9653-1.5857c1.2451-1.0056 2.4603-2.0653 3.638-3.1559-2.1078-10.0247-10.7415-17.5277-21.0855-17.5277-11.9192 0-21.5881 9.9705-21.5881 22.2615 0 12.2911 9.6689 22.2616 21.5881 22.2616 10.374 0 19.0377-7.5495 21.108-17.6051-.7576-.6806-1.5227-1.3459-2.3178-1.9801z" fill={color} />
		</svg>
	)
})
Contember.displayName = 'Contember'
