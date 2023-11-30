import { BoardBaseProps, createBoard } from '@contember/react-board'
import { BoardColumnRendererProps, BoardItemRendererProps, createBoardDndKitRenderer } from './BoardDndKitRenderer'
import React, { FunctionComponent, ReactNode } from 'react'

export * from './BoardDndKitRenderer'
export * from './types'

export const createBoardDndKit = <ColumnExtraProps extends {}, ItemExtraProps extends {}>({ Column, Item, Wrapper, usePortalProvider }: {
	Wrapper: React.ComponentType<{ children: ReactNode }>
	Column: React.ComponentType<BoardColumnRendererProps & ColumnExtraProps>
	Item: React.ComponentType<BoardItemRendererProps & ItemExtraProps>
	usePortalProvider?: () => Element | null
}): FunctionComponent<BoardBaseProps<ColumnExtraProps & ItemExtraProps>> => {
	const renderer = createBoardDndKitRenderer({ Column, Item, Wrapper, usePortalProvider })

	return createBoard<ColumnExtraProps & ItemExtraProps>({
		Renderer: renderer,
		ItemStaticRender: Item as any,
		ColumnStaticRender: Column as any,
	})
}

export * from '@contember/react-board'
