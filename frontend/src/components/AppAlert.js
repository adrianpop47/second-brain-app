import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { subscribeToAlerts } from '../utils/alertService';

const TYPE_MAP = {
  error: {
    icon: AlertTriangle,
    wrapper: 'bg-rose-50 text-rose-700',
    iconClass: 'text-rose-500'
  },
  success: {
    icon: CheckCircle2,
    wrapper: 'bg-emerald-50 text-emerald-700',
    iconClass: 'text-emerald-600'
  },
  info: {
    icon: Info,
    wrapper: 'bg-slate-50 text-slate-700',
    iconClass: 'text-indigo-500'
  }
};

const AppAlert = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((alert) => {
      setAlerts((prev) => [...prev, alert]);
      if (alert.duration !== Infinity) {
        setTimeout(() => {
          setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
        }, alert.duration);
      }
    });
    return unsubscribe;
  }, []);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[80] space-y-2 pointer-events-none">
      {alerts.map((alert) => {
        const { icon: Icon, wrapper, iconClass } = TYPE_MAP[alert.type] || TYPE_MAP.info;
        return (
          <div
            key={alert.id}
            className={`pointer-events-auto w-72 sm:w-80 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md ${wrapper}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-lg bg-white/60 ${iconClass}`}>
                <Icon size={16} />
              </div>
              <p className="text-sm leading-relaxed flex-1">{alert.message}</p>
              <button
                type="button"
                onClick={() => setAlerts((prev) => prev.filter((item) => item.id !== alert.id))}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppAlert;
