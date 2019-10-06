import * as React from 'react'
import { IconName, IconSvgPaths16 } from '@blueprintjs/icons'

export interface IconProps {
	children?: never
	title?: string
	blueprintIcon: IconName
}

const renderSvgPaths = (iconName: IconName): JSX.Element[] | null => {
	const pathStrings = IconSvgPaths16[iconName]
	if (!pathStrings) {
		return null
	}
	return pathStrings.map((d, i) => <path key={i} d={d} fillRule="evenodd" />)
}

export const Icon = React.memo((props: IconProps) => {
	return (
		<div className="icon">
			<svg viewBox="0 0 16 16" className="icon-blueprintSvg">
				{props.title && <desc>{props.title}</desc>}
				{renderSvgPaths(props.blueprintIcon)}
			</svg>
		</div>
	)
})
Icon.displayName = 'Icon'
