import { X } from 'lucide-react';
import TodoEditForm from './TodoEditForm';

const EditTodoModal = ({
  showModal,
  setShowModal,
  todo,
  onUpdate
}) => {
  if (!showModal || !todo) return null;

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSubmit = async (updates) => {
    await onUpdate(todo.id, updates);
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Edit Todo</h3>
            <p className="text-sm text-slate-500 mt-1">
              Tweak the details for this task.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="border-t border-slate-100 mt-4 mb-5" />

        <TodoEditForm
          todo={todo}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </div>
    </div>
  );
};

export default EditTodoModal;
