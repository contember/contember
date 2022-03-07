import { ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'

export const StyleProvider = ({ children }: { children: ReactNode }) => <div className={useComponentClassName('root')}>{children}</div>
