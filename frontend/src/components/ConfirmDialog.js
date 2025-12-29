import { useEffect, useState } from 'react';
import { subscribeToConfirmations, sendConfirmResponse } from '../utils/confirmService';

const toneStyles = {
  danger: {
    confirm: 'bg-rose-500 hover:bg-rose-600 text-white'
  },
  default: {
    confirm: 'bg-slate-800 hover:bg-slate-900 text-white'
  }
};

const optionToneClasses = {
  danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  default: 'bg-slate-800 hover:bg-slate-900 text-white'
};

const ConfirmDialog = () => {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToConfirmations((detail) => {
      setRequest(detail);
    });
    return unsubscribe;
  }, []);

  if (!request) return null;

  const tone = toneStyles[request.tone] || toneStyles.default;
  const hasOptions = Array.isArray(request.options) && request.options.length > 0;

  const getOptionClass = (toneKey) => optionToneClasses[toneKey] || optionToneClasses.default;

  const handleResponse = (result) => {
    sendConfirmResponse(request.id, result);
    setRequest(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
        {request.message && (
          <p className="text-sm mt-2 text-slate-600 whitespace-pre-wrap">{request.message}</p>
        )}
        <div className="flex flex-nowrap justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => handleResponse(false)}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            {request.cancelLabel || 'Cancel'}
          </button>
          {hasOptions ? (
            request.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleResponse(option.value)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${getOptionClass(option.tone || 'default')}`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <button
              type="button"
              onClick={() => handleResponse(true)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${tone.confirm}`}
            >
              {request.confirmLabel || 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
