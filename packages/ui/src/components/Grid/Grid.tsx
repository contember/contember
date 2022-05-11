import classNames from 'classnames'
import { CSSProperties, forwardRef, memo, useMemo } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { NativeProps } from '../../types'
import { useFallbackRef } from '../../utils/useFallbackRef'

export interface GridOwnProps {
  columnWidth: number
}

export interface GridProps extends GridOwnProps, NativeProps<HTMLDivElement> {}

export const Grid = memo(
  forwardRef<HTMLDivElement, GridProps>(
    ({
      className,
      columnWidth,
      children,
      ...rest
    }: GridProps, forwardedRef) => {
      if (columnWidth < 0) {
        throw new Error('Column width must be a non-negative number')
      }

      const ref = useFallbackRef(forwardedRef)
      const componentClassName = useComponentClassName('grid')
      const style: CSSProperties | undefined = useMemo(() => columnWidth ? ({
        ['--cui-grid-column-width' as any]: `${columnWidth}px`,
      }) : undefined, [columnWidth])

      return (
        <div
          ref={ref}
          className={classNames(
            componentClassName,
            className,
          )}
          style={style}
        >
          {children}
        </div>
      )
    },
  ),
)
Grid.displayName = 'Grid'
