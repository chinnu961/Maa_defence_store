import { useToast } from '../context/ToastContext.jsx';

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map((toast) => {
        const icon = toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
        const iconColor = toast.type === 'success' ? 'var(--accent-olive-light)' : 'var(--accent-gold)';
        return (
          <div key={toast.id} className={`toast${toast.type === 'success' ? ' toast-success' : ''}${toast.active ? ' active' : ''}`}>
            <i className={`fa-solid ${icon}`} style={{ color: iconColor }}></i>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
