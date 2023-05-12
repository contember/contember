import { useExpectSameValueReference } from '@contember/react-utils'
import { svgSizeProps, useClassName } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Globe = memo<ContemberIdentitySvgProps>(({
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
			className={useClassName(['brand-icon', 'brand-globe'], className)}
			fill="none"
			style={useMemo(() => ({ ...style, '--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<g stroke={color} strokeWidth={strokeWidth}>
				<circle cx="35.3694" cy="35.2976" r="20.1624" />
				<path d="m42.8001 53.5261c-1.1761-10.1917-.0008-15.6796 10.7139-19.3381" />
				<path d="m25.0781 19.4941c5.6178 4.0574 4.6814 4.8374 9.6748 4.8374 5.8186 0 5.7737 4.5254 4.5253 7.3342-1.2483 2.8088-4.5252 2.6527-8.4263 5.4615s-7.0529 11.5803-1.2539 18.1822" />
			</g>
		</svg>
	)
})
Globe.displayName = 'Globe'
