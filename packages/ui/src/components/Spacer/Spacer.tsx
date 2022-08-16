import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { NativeProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface SpacerProps extends Omit<NativeProps<HTMLDivElement>, 'children'> {
  gap?: Size | 'xlarge' | 'none'
}

export const Spacer = memo(({ className, gap, ...rest }: SpacerProps) => {
  const componentClassName = `${useClassNamePrefix()}spacer`

  return <div
    className={classNames(
      componentClassName,
      toEnumViewClass(gap),
      className,
    )}
    {...rest}
  />
})
