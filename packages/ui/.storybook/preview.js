import { useState } from 'react'
import '../src/index.sass'
import './global.sass'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    hideNoControlsWarning: true,
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    source: {
      type: 'dynamic',
      excludeDecorators: true,
    },
  },
}

const prefix = 'cui'

const Radio = /*<V extends RadioValue>*/({
  label,
  onChange,
  options,
  value,
  name,
}/*: {
  label?: string,
  value: V,
  name?: string,
  options: [value: V, label?: string][],
  onChange: (value: V) => void,
 } */) => {
  return <div>
    {label && <strong style={{ display: 'block' }}>{label}:</strong>}
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {options.map(([option, label]) => <label key={`${option}${label ? `-${label}` : ''}`} style={{ color: `var(--${prefix}-color--strong)` }}>
        <input name={name} checked={option === value} onChange={(event) => { event.target.checked && onChange(option) }} type="radio" value={option} />
        {label ?? option}
      </label>)}
    </div>
  </div>
}

export const decorators = [
  (Story) => {
    const [scheme, setScheme] = useState('system');
    const [position, setPosition] = useState('default');
    const [themeContent, setThemeContent] = useState('default');
    const [themeControls, setThemeControls] = useState('primary');

    return <div
      className={`scheme-${scheme}${position !== 'default' ? `-${position}` : ''} theme-${themeContent}-content theme-${themeControls}-controls`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        padding: '2em',
        backgroundColor: 'var(--cui-background-color)',
        color: 'var(--cui-color)',
        gap: '2em',
      }}
    >
      <div style={{ display: 'flex', gap: '2em', overflow: 'hidden' }}>
        <Radio
          label="Position"
          name="scheme"
          value={scheme}
          options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]}
          onChange={setScheme}
        />

        <Radio
          label="Scheme"
          name="position"
          value={position}
          options={[['default', 'Default'], ['above', 'Above'], ['below', 'Below']]}
          onChange={setPosition}
        />

        <Radio
          label="Content Theme"
          name="themeContent"
          value={themeContent}
          options={[
            ["default"], ["primary"], ["secondary"], ["tertiary"], ["positive"], ["success"], ["warn"], ["danger"]
          ]}
          onChange={setThemeContent}
        />
        <Radio
          label="Controls Theme"
          name="themeControls"
          value={themeControls}
          options={[
            ["default"], ["primary"], ["secondary"], ["tertiary"], ["positive"], ["success"], ["warn"], ["danger"]
          ]}
          onChange={setThemeControls}
        />

      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '1em',
        overflow: 'auto',
        marginLeft: '-2em',
        marginRight: '-2em',
        paddingLeft: '2em',
        paddingRight: '2em',
        paddingTop: '2em',
        paddingBottom: '2em',
      }}>
        <Story />
      </div>
    </div>
  },
]
