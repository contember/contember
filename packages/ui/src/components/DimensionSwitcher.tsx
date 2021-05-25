import cn from 'classnames'
import type { ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface DimensionSwitcherValue {
	key: string
	label: ReactNode
	options: { value: string; label: ReactNode; active: boolean }[]
}

export interface DimensionSwitcherProps {
	dimensions: DimensionSwitcherValue[]
}

export function DimensionSwitcher({ dimensions }: DimensionSwitcherProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}dimensionSwitcher`}>
			<div className={`${prefix}dimensionSwitcher-items`}>
				{dimensions.map(dimension => (
					<div className={`${prefix}dimensionSwitcher-item`} key={dimension.key}>
						<span className={`${prefix}dimensionSwitcher-item-label`}>{dimension.label}:</span>
						<span className={`${prefix}dimensionSwitcher-item-options`}>
							{dimension.options.map(option => (
								<span
									key={option.value}
									className={cn(`${prefix}dimensionSwitcher-item-option`, option.active && 'view-active')}
								>
									{option.label}
								</span>
							))}
						</span>
						<span className={`${prefix}dimensionSwitcher-item-icon`} />
					</div>
				))}
			</div>
		</div>
	)
}
DimensionSwitcher.displayName = 'DimensionSwitcher'
