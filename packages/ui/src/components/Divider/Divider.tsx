import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps } from '../../types'
import { StackOwnProps } from '../Stack'

export interface DividerOwnProps extends ComponentClassNameProps {
	/**
	 * A divider adds gap between siblings by default. Set to `false` to disable this behavior or change the gap size with the `gap` prop.
	 */
	gap?: StackOwnProps['gap']
	padding?: StackOwnProps['gap']
}

export type DividerProps = Omit<HTMLDivElementProps, keyof DividerOwnProps> & DividerOwnProps

/**
 * @group UI
 *
 * @example
 *
 * ```tsx
 * <Button>One</Button>
 * <Divider />
 * <Button>two</Button>
 * ```
 *
 * @example
 * Divider without a gap:
 * ```tsx
 * <Button>One</Button>
 * <Divider gap={false} />
 * <Button>two</Button>
 * ```
 *
 */
export const Divider = memo(({ className, componentClassName = 'divider', gap = true, padding, ...rest }: DividerProps) => {
	return (
		<div
			data-gap={dataAttribute(gap)}
			data-padding={dataAttribute(padding)}
			className={useClassName(componentClassName, className)}
			{...rest}
		/>
	)
})
Divider.displayName = 'Interface.Divider'
