import type { DetailedHTMLProps, HTMLAttributes } from 'react'

export type NativeProps<El extends Element> = DetailedHTMLProps<HTMLAttributes<El>, El>
