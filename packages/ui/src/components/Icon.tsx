import * as React from 'react'
import cn from 'classnames'
import { IconName as BlueprintIconName, IconSvgPaths16 } from '@blueprintjs/icons'
import { useClassNamePrefix } from '../auxiliary'
import { useComponentClassName } from '../auxiliary/useComponentClassName'
import { IconSize } from '../types'
import { toEnumViewClass } from '../utils'

// To be potentially extended later
export type IconName = BlueprintIconName

export interface IconProps {
	children?: never
	title?: string
	blueprintIcon: BlueprintIconName
	size?: IconSize
	style?: React.CSSProperties
}

const renderSvgPaths = (iconName: IconName): JSX.Element[] | null => {
	const pathStrings = IconSvgPaths16[iconName]
	if (!pathStrings) {
		return null
	}
	return pathStrings.map((d, i) => <path key={i} d={d} fillRule="evenodd" />)
}

export const Icon = React.memo((props: IconProps) => {
	const svgPaths = React.useMemo(() => renderSvgPaths(props.blueprintIcon), [props.blueprintIcon])
	const prefix = useClassNamePrefix()

	return (
		<div className={cn(`${prefix}icon`, toEnumViewClass(props.size))} style={props.style}>
			<svg viewBox="0 0 16 16" className={`${prefix}icon-blueprintSvg`}>
				{props.title && <desc>{props.title}</desc>}
				{svgPaths}
			</svg>
		</div>
	)
})
Icon.displayName = 'Icon'
