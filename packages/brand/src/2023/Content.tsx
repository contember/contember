import { useClassName, useExpectSameValueReference } from '@contember/react-utils'
import { svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const Content = memo<ContemberIdentitySvgProps>(({
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
			className={useClassName(['brand-icon', 'brand-content'], className)}
			fill="none"
			style={useMemo(() => ({ ...style, '--cui-icon--scale': scale } as CSSProperties), [scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(width, height, crop)}
		>
			<g stroke={color} strokeWidth={strokeWidth}>
				<path d="m13.4814 15.1365h43.0374v13.2422h-43.0374z" />
				<path d="m13.4814 38.0098h15.048v16.8538h-15.048z" />
				<path d="m40.2666 38.0098h16.2517v16.8538h-16.2517z" />
			</g>
		</svg>
	)
})
Content.displayName = 'Content'
