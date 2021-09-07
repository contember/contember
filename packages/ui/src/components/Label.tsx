import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface LabelProps {
  children: ReactNode
}

export const Label = memo(
  ({ children }: LabelProps) => {
    const prefix = useClassNamePrefix()

    return <span className={`${prefix}label`}>{children}</span>
  },
)

Label.displayName = 'Label'
