import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute, deprecate, fallback } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'
import { StackOwnProps } from '../Stack'

/** @deprecated Use other prop values */
export type DeprecatedSpacerSize = Size | 'xlarge' | 'none'

export interface SpacerOwnProps extends ComponentClassNameProps {
	shrink?: boolean
	grow?: boolean
	gap?: StackOwnProps['gap']
}

/** @deprecated Use `SpacerOwnProps` instead */
export interface DeprecatedSpacerProps {
	gap?: SpacerOwnProps['gap'] | DeprecatedSpacerSize
}

export type SpacerProps =
	& Omit<HTMLDivElementProps, 'children' | keyof SpacerOwnProps | keyof DeprecatedSpacerProps>
	& Omit<SpacerOwnProps, keyof DeprecatedSpacerProps>
	& DeprecatedSpacerProps

/**
 * @group UI
 */
export const Spacer = memo(({ className, componentClassName = 'spacer', gap = true, grow, shrink, ...rest }: SpacerProps) => {
	deprecate('1.3.0', gap === 'none', '`gap="none"`', '`gap={false}`')
	gap = fallback(gap, gap === 'none', false)

	deprecate('1.3.0', gap === 'small', '`gap="small"`', '`gap="gap"`')
	gap = fallback(gap, gap === 'small', 'gap')

	deprecate('1.3.0', gap === 'xlarge', '`gap="xlarge"`', '`gap="larger"`')
	gap = fallback(gap, gap === 'xlarge', 'larger')

	deprecate('1.3.0', gap === 'default', '`gap="default"`', 'omit the `gap` prop')
	gap = fallback(gap, gap === 'default', true)

	return <div
		data-gap={dataAttribute(gap)}
		data-grow={dataAttribute(grow)}
		data-shrink={dataAttribute(shrink)}
		className={useClassName(componentClassName, className)}
		{...rest}
	/>
})
