import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute, deprecate, fallback } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'

/** @deprecated Use other prop values */
export type DeprecatedDividerSize = Size | 'xlarge' | 'none'

export type DividerProps =
	& Omit<HTMLDivElementProps, 'children'>
	& ComponentClassNameProps
	& {
		gap?: boolean | 'gap' | 'gutter' | 'padding' | 'large' | 'larger' | DeprecatedDividerSize
	}

/**
 * @group UI
 */
export const Divider = memo(({ className, componentClassName = 'divider', gap = true, ...rest }: DividerProps) => {
	deprecate('1.3.0', gap === 'none', '`gap="none"`', '`gap={false}`')
	gap = fallback(gap, gap === 'none', false)

	deprecate('1.3.0', gap === 'small', '`gap="small"`', '`gap="gap"`')
	gap = fallback(gap, gap === 'small', 'gap')

	deprecate('1.3.0', gap === 'xlarge', '`gap="xlarge"`', '`gap="larger"`')
	gap = fallback(gap, gap === 'xlarge', 'larger')

	deprecate('1.3.0', gap === 'default', '`gap="default"`', 'omit the `gap` prop')
	gap = fallback(gap, gap === 'default', true)

	return (
		<div
			data-gap={dataAttribute(gap)}
			className={useClassName(componentClassName, className)}
			{...rest}
		/>
	)
})
Divider.displayName = 'Interface.Divider'
