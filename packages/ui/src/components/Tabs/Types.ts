import { Key, ReactNode } from 'react'

export interface TabItem {
  id: Key
  label: ReactNode
  isDisabled?: boolean
}
