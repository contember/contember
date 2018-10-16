import * as React from 'react'
import Environment from '../dao/Environment'

const environmentContext = React.createContext<Environment>(new Environment())

export default environmentContext
