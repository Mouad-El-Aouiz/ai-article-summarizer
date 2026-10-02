export default function Button({ children, type = 'button', variant = 'primary', size = 'medium', className = '', ...props }) {
  return <button type={type} className={`button button--${variant} button--${size} ${className}`} {...props}>{children}</button>
}
