import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'

export interface DimensionDatum {
	slug: string
	label: ReactNode
}
export interface StatefulDimensionDatum<IsSelected extends boolean = boolean> extends DimensionDatum {
	isSelected: IsSelected
}

export type SelectedDimensionRenderer = (dimensionData: StatefulDimensionDatum<true>[]) => ReactNode
