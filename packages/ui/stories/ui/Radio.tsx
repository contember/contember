export const Radio = <V extends string | number>({
	label,
	onChange,
	options,
	value,
	name,
}: {
	label?: string,
	value: V,
	name?: string,
	options: [value: V, label?: string][],
	onChange: (value: V) => void,
}) => {
	return <div>
		{label && <strong style={{ display: 'block' }}>{label}:</strong>}
		<div style={{ display: 'flex', flexWrap: 'wrap' }}>
			{options.map(([option, label]) => <label key={`${option}${label ? `-${label}` : ''}`} style={{ color: 'var(--cui--color--strong)' }}>
				<input
					name={name}
					checked={option === value}
					onChange={event => {
						event.target.checked && onChange(option)
					}}
					type="radio"
					value={option}
				/>
				{label ?? option}
			</label>)}
		</div>
	</div>
}
