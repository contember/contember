import { LinkButtonProps } from '@contember/admin'
import { CollapsibleProps, HTMLDivElementProps } from '@contember/ui'
import { ComponentClassNameProps } from '@contember/utilities'
import { PropsWithChildren } from 'react'

export type HorizontalMenuContainerProps =
  & ComponentClassNameProps
  & HTMLDivElementProps
  & PropsWithChildren<{
    compact?: boolean
    itemsContentHorizontal?: boolean
    itemsIconsScale?: number
    itemsSizeEvenly?: boolean
    horizontal?: boolean
    hover?: boolean
  }>

export type HorizontalMenuItemProps =
  & ComponentClassNameProps
  & {
    icon?: React.ReactNode
    title: string
  } & (
    | (
      & LinkButtonProps
      & { children?: undefined }
    )
    | Omit<CollapsibleProps, 'expanded'> & { to?: undefined }
  )
