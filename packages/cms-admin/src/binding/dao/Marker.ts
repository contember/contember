import EntityMarker from './EntityMarker'
import FieldMarker from './FieldMarker'
import MarkerTreeRoot from './MarkerTreeRoot'

type Marker = FieldMarker | EntityMarker | MarkerTreeRoot | undefined

export default Marker
