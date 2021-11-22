import classnames from 'classnames'
import { forwardRef, memo, ReactNode, useContext } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext } from '../../contexts'
import type { BoxDepth, NativeProps } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface StackOwnProps {
  depth?: BoxDepth | false
  direction: 'vertical' | 'horizontal' | 'vertical-reverse' | 'horizontal-reverse'
	children?: ReactNode
  align?: 'center' | 'stretch' | 'start' | 'end'
}

export interface StackProps extends StackOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const Stack = memo(
	forwardRef<HTMLDivElement, StackProps>(
		({ align, children, className, depth, direction, ...rest }: StackProps, ref) => {
			const boxDepth = useContext(BoxDepthContext)
			const prefix = useClassNamePrefix()

			return <>
				{children && (
          <div
            {...rest}
            className={classnames(
              `${prefix}stack`,
              depth !== false
                ? toViewClass(`depth-${Math.min(6, depth ?? boxDepth)}`, true)
                : null,
              toViewClass(`${direction}`, true),
              toEnumViewClass(`align-${align}`),
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
