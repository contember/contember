import * as React from 'react'
import { GetEntityByKey } from '../accessors'

export const GetEntityByKeyContext = React.createContext<GetEntityByKey>(() => undefined)
GetEntityByKeyContext.displayName = 'GetEntityByKeyContext'
