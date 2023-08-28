import { CommonSlotSources } from '@contember/layout'
import { omit } from '@contember/utilities'
import { SlotSources } from '../components/Slots'

const style = <style>{`
.slot-outline {
	align-items: center;
	border-radius: 0.5em;
	border: 2px solid rgb(var(--cui-color--accent-rgb-50));
	display: inline-flex;
	flex: 1 1 0px;
	justify-content: center;
	min-width: 0px;
	overflow: hidden;
	padding: 0 0.25em;
	min-height: calc(1em * var(--cui-line-height));
	white-space: nowrap;
}

.slot-outline:hover {
	flex-basis: auto;
}
`}</style>

export default () => {
	return (
		<>
			{style}
			<div className="slot-outline">
				children
			</div>
			<CommonSlotSources.Title>
				<div className="slot-outline">
					Slot: title
				</div>
			</CommonSlotSources.Title>
			{Object.entries(omit(SlotSources, ['Title'])).map(([key, Slot], index) => (
				<Slot key={index}>
					<div className="slot-outline">
						<div className="slot-outline-label">Slot: {key}</div>
					</div>
				</Slot>
			))}
		</>
	)
}

export const fallback = () => (
	<>
	</>
)
