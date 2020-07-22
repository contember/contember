import { Component, SugaredField, SugaredFieldProps } from '@contember/binding'
import { useRelativeSingleField } from '@contember/binding/dist/src/accessorPropagation/useRelativeSingleField'
import { FormGroup, FormGroupProps } from '@contember/ui'
import * as Leaflet from 'leaflet'
import * as React from 'react'
import { Map, MapProps, Marker, MarkerProps, TileLayer, TileLayerProps } from 'react-leaflet'

export interface LocationFieldProps extends Omit<FormGroupProps, 'children'> {
	latitudeField: SugaredFieldProps['field']
	longitudeField: SugaredFieldProps['field']
	mapCenter?: [number, number]
	zoom?: number
	tileLayerProps?: TileLayerProps
	mapProps?: MapProps
	markerProps?: MarkerProps
}

const markerIcon = Leaflet.divIcon({
	className: 'locationField-marker',
	iconSize: [24, 24],
	iconAnchor: [12, 23],
})

const defaultZoom = 5

export const LocationField = Component<LocationFieldProps>(
	({
		latitudeField,
		longitudeField,
		mapCenter,
		zoom = defaultZoom,
		tileLayerProps,
		mapProps,
		markerProps,
		...formGroupProps
	}) => {
		const latitude = useRelativeSingleField<number>(latitudeField)
		const longitude = useRelativeSingleField<number>(longitudeField)

		const moveMarker = (e: { latlng?: Leaflet.LatLng }) => {
			const latLng = e.latlng
			if (latLng === undefined) {
				return
			}
			latitude.updateValue?.(latLng.lat)
			longitude.updateValue?.(latLng.lng)
		}

		const [resolvedCenter] = React.useState((): [number, number] => {
			if (mapCenter !== undefined) {
				return mapCenter
			}
			if (latitude.currentValue !== null && longitude.currentValue !== null) {
				return [latitude.currentValue, longitude.currentValue]
			}
			return [50.102223, 9.254419] // Center of Europe.
		})

		return (
			<FormGroup {...formGroupProps}>
				<div className="locationField-map-container">
					<Map
						center={resolvedCenter}
						zoom={zoom}
						className="locationField-map-canvas"
						{...(mapProps ?? {})}
						onclick={moveMarker}
					>
						<TileLayer
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							{...(tileLayerProps ?? {})}
						/>
						{latitude.currentValue !== null && longitude.currentValue !== null && (
							<Marker
								icon={markerIcon}
								{...(markerProps ?? {})}
								position={[latitude.currentValue, longitude.currentValue]}
								onmove={moveMarker as any}
								draggable
							/>
						)}
					</Map>
				</div>
			</FormGroup>
		)
	},
	props => (
		<>
			<SugaredField field={props.latitudeField} />
			<SugaredField field={props.longitudeField} />
		</>
	),
	'LocationField',
)
