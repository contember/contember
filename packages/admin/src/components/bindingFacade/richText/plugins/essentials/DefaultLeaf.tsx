import * as React from 'react'
import { RenderLeafProps } from 'slate-react'

export interface DefaultLeafProps extends RenderLeafProps {}

export const DefaultLeaf: React.FunctionComponent<DefaultLeafProps> = ({ attributes, children, leaf }) =>
	React.createElement('span', attributes, children)
DefaultLeaf.displayName = 'DefaultLeaf'
