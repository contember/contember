import * as React from 'react'
import { GetSubTree } from '../accessors'

export const defaultGetSubTree = ((() => null) as unknown) as GetSubTree

export const GetSubTreeContext = React.createContext<GetSubTree>(defaultGetSubTree)
GetSubTreeContext.displayName = 'GetSubTreeContext'
