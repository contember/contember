export const Button = ({
  onClick,
  children,
}: {
  children?: string,
  onClick: () => void,
 }) => {
  return <button
    onClick={() => {
      onClick()
    }}
    style={{ backgroundColor: 'var(--cui-background-color--controls-rgb-50)', border: '1px solid', borderRadius: '0.25em', color: 'rgb(var(--cui-color--rgb-0))', padding: '0.25em 0.33em' }}
  >
    {children}
  </button>
}
