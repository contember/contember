import classNames from 'classnames'
import { useClassNamePrefix } from '../../../auxiliary'
import { toStateClass } from '../../../utils'

export interface RadioButtonProps {
  isFocused?: boolean
  isChecked?: boolean
  isIndeterminate?: boolean
  isDisabled?: boolean
  isReadonly?: boolean
  isHovered?: boolean
	isInvalid?: boolean
}

export const RadioButton = ({
  isChecked,
  isDisabled,
  isFocused,
  isHovered,
  isIndeterminate,
  isReadonly,
  isInvalid,
}: RadioButtonProps) => {
  const componentClassName = `${useClassNamePrefix()}radio-button`

  return <span
    className={classNames(
      `${componentClassName}`,
      toStateClass('checked', isChecked),
      toStateClass('disabled', isDisabled),
      toStateClass('focused', isFocused),
      toStateClass('hovered', isHovered),
      toStateClass('invalid', isInvalid),
      toStateClass('indeterminate', isIndeterminate),
      toStateClass('readonly', isReadonly),
    )}
    children={isIndeterminate
      ? <span aria-hidden="true" className={`${componentClassName}-questionmark`}>?</span>
      : undefined}
  />
}
