import { CircleAlert, X } from 'lucide-react'
export default function ErrorMessage({ message, onDismiss }) {
  return <div role="alert" className="notice notice--error"><CircleAlert size={18} /><span>{message}</span>{onDismiss && <button type="button" onClick={onDismiss} className="icon-button" aria-label="Dismiss error" title="Dismiss error"><X size={16} /></button>}</div>
}
