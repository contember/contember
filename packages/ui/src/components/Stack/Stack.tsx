import classnames from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { NativeProps, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface StackOwnProps {
  align?: 'center' | 'stretch' | 'start' | 'end'
  direction: 'vertical' | 'horizontal' | 'vertical-reverse' | 'horizontal-reverse'
	gap?: Size
	children?: ReactNode
  justify?:
   | 'center'
   | 'start'
   | 'end'
   | 'space-between'
   | 'space-around'
   | 'space-evenly'
   | 'stretch'
   | 'inherit'
   | 'initial'
   | 'revert'
}

export interface StackProps extends StackOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const Stack = memo(
	forwardRef<HTMLDivElement, StackProps>(
		({ align, children, className, direction, gap, justify, ...rest }: StackProps, ref) => {
			const prefix = useClassNamePrefix()

			return <>
				{children && (
          <div
            {...rest}
            className={classnames(
              `${prefix}stack`,
              toViewClass(`${direction}`, true),
              toEnumViewClass(gap),
              align && toEnumViewClass(`align-${align}`),
              justify && toEnumViewClass(`justify-${justify}`),
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
