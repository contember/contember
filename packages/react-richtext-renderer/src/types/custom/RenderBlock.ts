import { ComponentType, ReactNode } from 'react'

export type RenderBlockProps = {
	block: unknown,
	children?: ReactNode
}

export type RenderBlock = ComponentType<RenderBlockProps>
