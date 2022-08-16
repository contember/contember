import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { NativeProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface DividerProps extends Omit<NativeProps<HTMLDivElement>, 'children'> {
  gap?: Size | 'xlarge' | 'none'
}

export const Divider = memo(({ className, gap, ...rest }: DividerProps) => {
  const componentClassName = `${useClassNamePrefix()}divider`

  return <div
    className={classNames(
      componentClassName,
      toEnumViewClass(gap),
      className,
    )}
    {...rest}
  />
})
