import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { Default, NativeProps } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'

export interface LabelProps extends NativeProps<HTMLSpanElement> {
  isDisabled?: boolean
  isActive?: boolean
  isFocused?: boolean
  isHover?: boolean
  size?: Default | 'small'
}

export const Label = memo(({
  className,
  isDisabled,
  isActive,
  isFocused,
  isHover,
  children,
  size,
}: LabelProps) => {
  const prefix = `${useClassNamePrefix()}label`
  const classList = classNames(
    prefix,
    toStateClass('active', !isDisabled && isActive),
    toStateClass('focused', !isDisabled && isFocused),
    toStateClass('disabled', isDisabled),
    toStateClass('hover', !isDisabled && isHover),
    toEnumViewClass(size),
    className,
  )

  return <span className={classList}>{children}</span>
})

Label.displayName = 'Label'
