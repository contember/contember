import { useExpectSameValueReference } from '@contember/react-utils'
import { listClassName, svgSizeProps } from '@contember/utilities'
import { CSSProperties, memo, useMemo } from 'react'
import type { ContemberIdentitySvgProps } from '../Types'

export const LogoType = memo<ContemberIdentitySvgProps>(({
	className,
	color = 'currentColor',
	crop = 35,
	height = 130,
	scale,
	strokeWidth = 6,
	style,
	width = 440,
	...rest
}) => {
	useExpectSameValueReference(style)

	if (import.meta.env.DEV) {
		const exhaustiveCheck: Record<PropertyKey, never> = rest
	}

	const sizeProps = svgSizeProps(width, height, crop)
	const aspectRatio = sizeProps.width / sizeProps.height

	return (
		<svg
			className={listClassName(['cui-brand-logo-type', className])}
			style={useMemo(() => ({
				'--scale': scale,
				'--aspect-ratio': aspectRatio,
				...style,
			} as CSSProperties), [aspectRatio, scale, style])}
			xmlns="http://www.w3.org/2000/svg"
			{...sizeProps}
		>
			<g fill={color} stroke="none">
				<path d="m36.9851 62.4293c0-14.5746 11.5202-25.5713 27.0862-25.5713 4.679 0 10.0515 1.5397 14.2392 4.345v10.8597c-3.7673-3.7149-8.9377-5.8134-13.8898-5.8134-10.1225 0-16.9637 6.8654-16.9637 16.18 0 9.3145 6.8412 16.0429 16.9637 16.0429 4.9575 0 10.1225-2.104 13.8898-5.8134v10.8597c-4.1877 2.7999-9.5656 4.345-14.2392 4.345-15.566-.0055-27.0862-10.9364-27.0862-25.4342z" />
				<path d="m82.5637 69.2234c0-10.646 8.3754-18.7058 19.2673-18.7058 10.893 0 19.268 8.0543 19.268 18.7058s-8.446 18.6346-19.268 18.6346c-10.8209 0-19.2673-8.1256-19.2673-18.6346zm19.2673 9.7365c5.307 0 9.353-4.1313 9.353-9.7365s-4.051-9.8077-9.353-9.8077c-5.3011 0-9.3522 4.2025-9.3522 9.8077s4.0511 9.7365 9.3522 9.7365z" />
				<path d="m161.234 67.1907v19.8235h-9.773v-19.4729c0-4.9038-2.932-8.1256-7.398-8.1256s-7.398 3.2218-7.398 8.1256v19.4729h-9.773v-19.8235c0-10.0872 6.77-16.6731 17.171-16.6731s17.171 6.5859 17.171 16.6731z" />
				<path d="m180.71 41.7619v9.5995h11.727v8.1256h-11.727v12.6787c0 5.0464 2.86 7.1449 5.934 7.1449 2.512 0 4.259-.7014 5.793-1.5397v8.5475c-2.511 1.052-5.236 1.5397-7.54 1.5397-7.96 0-14.032-4.8327-14.032-15.1335v-13.2376h-5.721v-8.1256h5.721v-9.5995z" />
				<path d="m195.44 69.2234c0-10.4378 7.262-18.6347 17.941-18.6347 11.378 0 17.592 9.1776 15.986 20.6674h-25.268c.978 5.1833 5.236 8.6187 11.936 8.6187 4.466 0 8.795-1.7533 12.148-4.6244v8.3338c-2.861 2.5204-7.611 4.2738-13.819 4.2738-11.307 0-18.918-7.4955-18.918-18.6346zm24.569-4.482c-.278-3.9231-3.281-6.7941-7.398-6.7941-4.116 0-7.119 2.3122-8.239 6.7941z" />
				<path d="m245.976 67.7495v19.2647h-9.773v-35.6528h9.773v5.4627c2.026-4.0655 6.142-6.3065 9.773-6.3065 5.094 0 8.654 2.0985 10.609 6.0928 2.79-3.9943 6.633-6.0928 11.585-6.0928 7.89 0 12.564 5.6052 12.564 15.7635v20.7331h-9.774v-19.8948c0-4.7614-2.304-7.7037-5.934-7.7037-3.981 0-6.563 3.2218-6.563 8.3338v19.2647h-9.773v-19.8948c0-4.7614-2.304-7.7037-5.864-7.7037-4.051 0-6.634 3.2218-6.634 8.3338z" />
				<path d="m308.311 81.6228v5.3914h-9.773v-49.3178h9.773v19.0565c2.162-3.9943 6.213-6.2353 11.378-6.2353 9.631 0 17.242 7.9174 17.242 18.7058 0 10.7885-7.611 18.6346-17.242 18.6346-5.165 0-9.216-2.2409-11.378-6.2352zm9.353-2.6629c5.307 0 9.352-4.1313 9.352-9.7365s-4.051-9.8077-9.352-9.8077c-5.302 0-9.353 4.2025-9.353 9.8077s4.051 9.7365 9.353 9.7365z" />
				<path d="m341.255 69.2234c0-10.4378 7.262-18.6347 17.941-18.6347 11.379 0 17.592 9.1776 15.987 20.6674h-25.268c.977 5.1833 5.236 8.6187 11.935 8.6187 4.466 0 8.796-1.7533 12.148-4.6244v8.3338c-2.861 2.5204-7.611 4.2738-13.819 4.2738-11.307 0-18.918-7.4955-18.918-18.6346zm24.57-4.482c-.279-3.9231-3.282-6.7941-7.398-6.7941-4.117 0-7.12 2.3122-8.239 6.7941z" />
				<path d="m397.655 59.6952c-4.116 0-6.349 3.2929-6.349 9.0351v18.2839h-9.773v-19.8948c0-10.1583 4.258-16.6018 14.31-16.6018 1.463 0 4.815.3506 6.142.8383v9.3146c-.699-.4877-3.352-.9808-4.33-.9808z" />
			</g>
		</svg>
	)
})
LogoType.displayName = 'LogoType'
