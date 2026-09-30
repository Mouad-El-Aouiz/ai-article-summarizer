// src/components/ui/Button.jsx
const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
}

const sizes = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2',
  large: 'px-6 py-3'
}

export default function Button({ children, onClick, type = 'button', variant = 'primary', size = 'medium', disabled = false, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
