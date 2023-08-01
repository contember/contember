export const Select = <V extends string>({
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
  return <label style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', gap: '0.5em' }}>
    {label && <strong style={{ display: 'block' }}>{label}:</strong>}
    <select name={name} value={value} onChange={event => {
      const value: V = event.target.value as V
      onChange(value)
    }} style={{ backgroundColor: 'var(--cui-background-color--controls-rgb-50)', borderRadius: '0.25em', color: 'rgb(var(--cui-color--rgb-0))', padding: '0.25em 0.33em' }}>
      {options.map(([option, label], index) => <option key={index} value={option}>{label ?? option}</option>)}
    </select>
  </label>
}
