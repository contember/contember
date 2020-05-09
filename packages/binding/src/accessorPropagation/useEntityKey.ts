import * as React from 'react'
import { EntityKeyContext } from './EntityKeyContext'

export const useEntityKey = () => React.useContext(EntityKeyContext)
