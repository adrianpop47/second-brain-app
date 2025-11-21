import { useState, useEffect } from 'react';
import { X, Briefcase, Heart, Home, Book, Music, Coffee, Camera, Plane, ShoppingBag, Dumbbell, GraduationCap, Palette, Code, Zap, Target, Sparkles, Sun, Moon, Star, Gift } from 'lucide-react';

const ContextSettingsModal = ({ context, show, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    emoji: 'Briefcase',
    color: '#000000'
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Icon options that match the app style
  const iconOptions = [
    { name: 'Briefcase', icon: Briefcase, label: 'Work' },
    { name: 'Heart', icon: Heart, label: 'Health' },
    { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
    { name: 'Home', icon: Home, label: 'Home' },
    { name: 'Book', icon: Book, label: 'Learning' },
    { name: 'GraduationCap', icon: GraduationCap, label: 'Education' },
    { name: 'Music', icon: Music, label: 'Music' },
    { name: 'Coffee', icon: Coffee, label: 'Social' },
    { name: 'Camera', icon: Camera, label: 'Creative' },
    { name: 'Palette', icon: Palette, label: 'Art' },
    { name: 'Plane', icon: Plane, label: 'Travel' },
    { name: 'ShoppingBag', icon: ShoppingBag, label: 'Shopping' },
    { name: 'Code', icon: Code, label: 'Dev' },
    { name: 'Zap', icon: Zap, label: 'Energy' },
    { name: 'Target', icon: Target, label: 'Goals' },
    { name: 'Sparkles', icon: Sparkles, label: 'Special' },
    { name: 'Sun', icon: Sun, label: 'Wellness' },
    { name: 'Moon', icon: Moon, label: 'Rest' },
    { name: 'Star', icon: Star, label: 'Favorites' },
    { name: 'Gift', icon: Gift, label: 'Gifts' },
  ];

  const commonColors = [
    '#000000', // Black
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ];

  useEffect(() => {
    if (context) {
      setFormData({
        name: context.name || '',
        emoji: context.emoji || 'Briefcase',
        color: context.color || '#000000'
      });
    }
  }, [context]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Field name is required');
      return;
    }
    onSave({ ...context, ...formData });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${context.name}"? All data in this field will be permanently deleted.`)) {
      onDelete(context.id);
    }
  };

  if (!show) return null;

  // Get the selected icon component
  const selectedIconOption = iconOptions.find(opt => opt.name === formData.emoji) || iconOptions[0];
  const SelectedIcon = selectedIconOption.icon;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-slate-800">Field Settings</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Enter field name"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <div className="p-1.5 bg-slate-200 rounded-lg">
                  <SelectedIcon size={20} className="text-slate-700" />
                </div>
                <span className="text-sm text-slate-600">{selectedIconOption.label}</span>
              </button>
              
              {showEmojiPicker && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg p-3 shadow-lg max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {iconOptions.map(option => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, emoji: option.name });
                            setShowEmojiPicker(false);
                          }}
                          className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-1 ${
                            formData.emoji === option.name
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <IconComponent size={20} />
                          <span className="text-xs">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <div 
                  className="w-6 h-6 rounded-full border-2 border-slate-300"
                  style={{ backgroundColor: formData.color }}
                ></div>
                <span className="text-sm text-slate-600">{formData.color}</span>
              </button>
              
              {showColorPicker && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                  <div className="grid grid-cols-4 gap-2">
                    {commonColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, color });
                          setShowColorPicker(false);
                        }}
                        className="w-full aspect-square rounded-lg border-2 hover:border-indigo-400 transition-colors"
                        style={{ 
                          backgroundColor: color,
                          borderColor: formData.color === color ? '#6366F1' : '#E2E8F0'
                        }}
                      ></button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Created Date */}
          {context?.createdAt && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Created</label>
              <p className="text-sm text-slate-600">
                {new Date(context.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Delete Button */}
          {context?.id && (
            <button
              onClick={handleDelete}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-lg font-medium transition-all text-sm border border-red-200"
            >
              Delete Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextSettingsModal;
