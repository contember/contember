import classNames from 'classnames'
import { useComponentClassName } from '../../../auxiliary'
import { toStateClass } from '../../../utils'
import { AllVisuallyDependentControlProps } from '../Types'
import { useInputClassName } from '../hooks/useInputClassName'

export interface CheckboxButtonProps extends AllVisuallyDependentControlProps {
  checked?: boolean | null
  indeterminate?: boolean
}

export const CheckboxButton = ({
  id,
  checked,
  indeterminate,
  ...props
}: CheckboxButtonProps) => {
  const componentClassName = useComponentClassName('checkbox-button')

  return <span
    id={id}
    className={classNames(
      componentClassName,
      toStateClass('checked', checked === true),
      toStateClass('indeterminate', indeterminate),
      useInputClassName(props),
    )}
    children={indeterminate
      ? <span aria-hidden="true" className={`${componentClassName}-questionmark`}>?</span>
      : undefined}
  />
}
