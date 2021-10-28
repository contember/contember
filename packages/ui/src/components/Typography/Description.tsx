import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface DescriptionProps {
  children: ReactNode
}

export const Description = memo(
  ({ children }: DescriptionProps) => {
    const prefix = useClassNamePrefix()

    return <span className={`${prefix}description`}>{children}</span>
  },
)

Description.displayName = 'Description'
