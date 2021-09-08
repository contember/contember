import classnames from 'classnames'
import { forwardRef, memo, ReactNode, useContext } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { BoxDepthContext } from '../contexts'
import type { BoxDepth, NativeProps } from '../types'
import { toViewClass } from '../utils'

export interface StackOwnProps {
  depth?: BoxDepth
  direction: 'vertical' | 'horizontal' | 'vertical-reverse' | 'horizontal-reverse'
	children?: ReactNode
}

export interface StackProps extends StackOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const Stack = memo(
	forwardRef<HTMLDivElement, StackProps>(
		({ children, className, depth, direction, ...rest }: StackProps, ref) => {
			const boxDepth = useContext(BoxDepthContext)
			const prefix = useClassNamePrefix()

			return <>
				{children && (
          <div
            {...rest}
            className={classnames(
              `${prefix}stack`,
              toViewClass(`depth-${Math.min(6, depth ?? boxDepth)}`, true),
              toViewClass(`${direction}`, true),
              className,
            )}
            ref={ref}
          >
            {children}
          </div>
				)}
			</>
		},
	),
)
Stack.displayName = 'Stack'
