import { memo, PropsWithChildren } from 'react'
import { visuallyHiddenStyle } from './visuallyHiddenStyle'

export const VisuallyHidden = memo<PropsWithChildren>(({
  children,
}) => (
  <div style={visuallyHiddenStyle}>{children}</div>
))
VisuallyHidden.displayName = 'VisuallyHidden'
