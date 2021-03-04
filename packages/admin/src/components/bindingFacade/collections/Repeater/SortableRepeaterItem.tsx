import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { SortableElement } from 'react-sortable-hoc'

export interface SortableRepeaterItemProps {
	children: ReactNode
}

export const SortableRepeaterItem = memo(
	SortableElement(({ children }: SortableRepeaterItemProps) => <>{children}</>),
)
SortableRepeaterItem.displayName = 'SortableRepeaterItem'
