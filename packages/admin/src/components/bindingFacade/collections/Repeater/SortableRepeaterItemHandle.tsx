import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { SortableHandle } from 'react-sortable-hoc'

export interface SortableRepeaterItemHandleProps {
	children: ReactNode
}

export const SortableRepeaterItemHandle = memo(
	SortableHandle(({ children }: SortableRepeaterItemHandleProps) => <>{children}</>),
)
SortableRepeaterItemHandle.displayName = 'SortableRepeaterItemHandle'
