import * as React from 'react'
import { GetEntityByKey } from '../accessors'

export const defaultGetEntityByKey: GetEntityByKey = () => null

export const GetEntityByKeyContext = React.createContext<GetEntityByKey>(defaultGetEntityByKey)
GetEntityByKeyContext.displayName = 'GetEntityByKeyContext'
