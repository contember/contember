import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface FieldLabelProps {
  children: ReactNode
}

export const FieldLabel = memo(
  ({ children }: FieldLabelProps) => {
    const prefix = useClassNamePrefix()

    return <span className={`${prefix}field-label`}>{children}</span>
  },
)

FieldLabel.displayName = 'FieldLabel'
