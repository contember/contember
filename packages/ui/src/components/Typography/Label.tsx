import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { Default } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'

export interface LabelProps {
  isDisabled?: boolean
  isActive?: boolean
  isFocused?: boolean
  isHover?: boolean
  children: ReactNode
  size?: Default | 'small'
}

export const Label = memo(({
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
  )

  return <span className={classList}>{children}</span>
})

Label.displayName = 'Label'
