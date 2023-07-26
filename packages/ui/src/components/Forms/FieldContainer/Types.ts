import { Default } from '../../../types'

export type FieldContainerLabelPosition =
	| 'bottom'
	| 'left'
	| 'right'
	| 'top'
	| DeprecatedFieldContainerLabelPosition

/** @deprecated Use combination of `display` and `labelPosition` props */
export type DeprecatedFieldContainerLabelPosition =
	| Default
  | 'labelLeft'
  | 'labelRight'
  | 'labelInlineLeft'
  | 'labelInlineRight'
