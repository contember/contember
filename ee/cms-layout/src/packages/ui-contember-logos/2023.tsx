import { CSSProperties } from 'react'
import { listClassName } from '../class-name'
import { px } from '../css-utilities'

export type IconProps = {
	size?: number;
	className?: string | undefined;
}

export function ContemberEditLogo2023({ className, size }: IconProps) {
	return (
		<svg
			className={listClassName(['svg-icon', className])}
			style={{ '--size': px(size) } as CSSProperties}
			width="70"
			height="70"
			viewBox="0 0 70 70"
			fill="none"
			stroke="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M23.4356 47.8008L19.5882 25.8197L50.2244 19.2219L45.156 51.5346L23.4356 47.8008Z" strokeWidth="6" />
		</svg>
	)
}
