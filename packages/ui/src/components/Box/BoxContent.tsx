import classnames from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { BoxDistinction, Intent, NativeProps, Size } from '../../types'
import { toEnumViewClass, toThemeClass } from '../../utils'
import { Stack } from '../Stack'

export interface BoxContentOwnProps {
	gap?: Size
	distinction?: BoxDistinction
	children?: ReactNode
	intent?: Intent
}

export interface BoxContentProps extends BoxContentOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const BoxContent = memo(
	forwardRef<HTMLDivElement, BoxContentProps>(
		({ children, className, distinction, gap, intent, ...rest }: BoxContentProps, ref) => {
			const prefix = useClassNamePrefix()

			return <>
				{children && <div
					{...rest}
					className={classnames(
						`${prefix}box-content`,
						toThemeClass(intent),
						toEnumViewClass(distinction),
						className,
					)}
					ref={ref}
				>
					<Stack gap={gap ?? 'small'} direction="vertical">
						{children}
					</Stack>
				</div>}
			</>
		},
	),
)
BoxContent.displayName = 'BoxContent'
