import * as React from 'react'
import { DataRendererProps } from '../../coreComponents/DataProvider'

export default interface CommonRendererProps {
	title?: React.ReactNode
}

export interface RendererProps extends CommonRendererProps, DataRendererProps {}
