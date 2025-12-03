import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Search, ChevronDown, ListOrdered, List } from 'lucide-react';
import apiService from '../services/apiService';
import { showAppAlert } from '../utils/alertService';
import { confirmAction } from '../utils/confirmService';

const createEmptyForm = () => ({ title: '', body: '', tags: [] });
const stripHtml = (text = '') => text.replace(/<[^>]+>/g, ' ');
const getNotePreview = (text, limit = 140) => {
  const normalized = stripHtml(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
};

const getNoteTimestamp = (createdAt) => {
  if (!createdAt) return { date: '', time: '' };
  const hasTime = createdAt.includes('T');
  let date;
  if (hasTime) {
    date = new Date(createdAt);
  } else {
    const [year, month, day] = createdAt.split('-').map(Number);
    date = new Date(year, month - 1, day);
  }
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = hasTime
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';
  return { date: formattedDate, time: formattedTime };
};

const areTagsEqual = (source = [], target = []) => {
  if (source.length !== target.length) return false;
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== target[i]) {
      return false;
    }
  }
  return true;
};

const ContextNotes = ({ context }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState(createEmptyForm());
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [draftMode, setDraftMode] = useState(false);
  const tagInputRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getContextNotes(context.id);
        const fetched = response.data || [];
        setNotes(fetched);
        setSelectedNoteId(fetched.length ? fetched[0].id : null);
        setDraftMode(false);
      } catch (err) {
        setNotes([]);
        setError(err.message || 'Failed to load notes');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [context.id]);

  useEffect(() => {
    if (!selectedNoteId || draftMode) {
      setEditForm(createEmptyForm());
      setIsAddingTag(false);
      return;
    }
    const note = notes.find((n) => n.id === selectedNoteId);
    if (note) {
      setEditForm({
        title: note.title || '',
        body: note.body || note.description || '',
        tags: note.tags || []
      });
      setTagInput('');
      setIsAddingTag(false);
    }
  }, [selectedNoteId, notes, draftMode]);

  useEffect(() => {
    if (!draftMode) return;
    const hasContent = editForm.title.trim() || editForm.body.trim();
    if (!hasContent) return;

    let cancelled = false;
    const createNote = async () => {
      try {
        setSaving(true);
        const response = await apiService.createContextNote(context.id, {
          title: editForm.title,
          body: editForm.body,
          tags: editForm.tags || []
        });
        if (cancelled) return;
        const newNote = response.data;
        setNotes((prev) => [newNote, ...prev]);
        setSelectedNoteId(newNote.id);
        setDraftMode(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to save note');
        }
      } finally {
        if (!cancelled) {
          setSaving(false);
        }
      }
    };
    createNote();
    return () => {
      cancelled = true;
    };
  }, [draftMode, editForm.title, editForm.body, editForm.tags, context.id]);

  useEffect(() => {
    if (!selectedNoteId || draftMode) return;
    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note) return;
    const originalTitle = note.title || '';
    const originalBody = note.body || note.description || '';
    const originalTags = note.tags || [];
    const currentTags = editForm.tags || [];
    if (
      originalTitle === editForm.title &&
      originalBody === editForm.body &&
      areTagsEqual(originalTags, currentTags)
    ) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const response = await apiService.updateNote(selectedNoteId, {
          title: editForm.title,
          body: editForm.body,
          tags: editForm.tags || []
        });
        const updated = response.data;
        setNotes((prev) => prev.map((n) => (n.id === selectedNoteId ? updated : n)));
      } catch (err) {
        setError(err.message || 'Failed to save note');
      }
    }, 600);

    return () => clearTimeout(handler);
  }, [selectedNoteId, editForm.title, editForm.body, editForm.tags, notes, draftMode]);

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isAddingTag]);

  const handleCreateNote = () => {
    setDraftMode(true);
    setSelectedNoteId(null);
    setEditForm(createEmptyForm());
    setTagInput('');
    setIsAddingTag(false);
    setError(null);
  };

  const handleDeleteNote = async (noteId) => {
    const noteToDelete = notes.find((n) => n.id === noteId);
    const confirmed = await confirmAction({
      title: 'Delete note?',
      message: noteToDelete?.title
        ? `“${noteToDelete.title}” will be permanently removed.`
        : 'This note will be permanently removed.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await apiService.deleteNote(noteId);
      setNotes((prev) => prev.filter((noteItem) => noteItem.id !== noteId));
      if (selectedNoteId === noteId) {
        const remaining = notes.filter((noteItem) => noteItem.id !== noteId);
        setSelectedNoteId(remaining.length ? remaining[0].id : null);
      }
      setDraftMode(false);
      setIsAddingTag(false);
      setTagInput('');
      showAppAlert('Note deleted', { type: 'info' });
    } catch (err) {
      const message = err.message || 'Failed to delete note';
      setError(message);
      showAppAlert(message);
    }
  };

  const selectedNote = notes.find((note) => note.id === selectedNoteId) || null;
  const filteredNotes = notes.filter((note) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (note.title || '').toLowerCase().includes(query) ||
      (note.body || '').toLowerCase().includes(query) ||
      (note.tags || []).some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleCancelTagInput = () => {
    setTagInput('');
    setIsAddingTag(false);
  };

  const handleStartAddTag = () => {
    setTagInput('');
    setIsAddingTag(true);
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) {
      handleCancelTagInput();
      return;
    }
    if (editForm.tags?.includes(value)) {
      handleCancelTagInput();
      return;
    }
    const nextTags = [...(editForm.tags || []), value];
    setEditForm((prev) => ({
      ...prev,
      tags: nextTags
    }));
    setTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tag) => {
    const nextTags = (editForm.tags || []).filter((t) => t !== tag);
    setEditForm((prev) => ({
      ...prev,
      tags: nextTags
    }));
  };

  return (
    <div className="space-y-4 px-3 sm:px-4 md:px-6">
      <div className="my-4 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
            <p className="text-sm text-slate-500 mt-1">
              Capture this field’s ideas, meeting summaries, and learnings in one place.
            </p>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
        <div className="mt-4 h-px bg-slate-100" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[360px_12px_1fr] lg:h-[calc(100vh-220px)]">
        <div className="flex flex-col h-full lg:pr-0">
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={saving}
              className="w-full inline-flex items-center justify-start gap-2 rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add new note
            </button>
          </div>
          {loading ? (
            <div className="flex-1 rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex-1 rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              No notes found
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-0">
              {filteredNotes.map((note) => {
                const { date } = getNoteTimestamp(note.createdAt);
                const tags = Array.isArray(note.tags) ? note.tags : [];
                return (
                  <div
                    key={note.id}
                    className={`relative w-full p-4 rounded-2xl cursor-pointer transition-all ${
                      note.id === selectedNoteId
                        ? 'bg-indigo-50 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      setDraftMode(false);
                      setSelectedNoteId(note.id);
                    }}
                  >
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      {date}
                    </div>
                    <div className="mt-2 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {note.title || 'Untitled note'}
                      </p>
                      {getNotePreview(note.body) && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{getNotePreview(note.body)}</p>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={`${note.id}-${tag}`}
                            className="text-[11px] font-medium text-slate-700 bg-slate-200/80 rounded-lg px-2.5 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="w-px h-full bg-slate-200 mx-auto rounded-full" />
        </div>

        <div className="flex flex-col h-full lg:pl-0">
          {draftMode || selectedNote ? (
            <NotePanelContent
              draftMode={draftMode}
              selectedNote={selectedNote}
              editForm={editForm}
              setEditForm={setEditForm}
              tagInput={tagInput}
              setTagInput={setTagInput}
              isAddingTag={isAddingTag}
              onStartAddTag={handleStartAddTag}
              onCancelTagInput={handleCancelTagInput}
              tagInputRef={tagInputRef}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onDelete={handleDeleteNote}
              onClose={() => {
                setDraftMode(false);
                setSelectedNoteId(null);
                setEditForm(createEmptyForm());
                handleCancelTagInput();
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <p className="text-sm">Select a note to start editing</p>
              <p className="text-xs">or click “Add Note” to create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FONT_OPTIONS = ['Inter', 'Georgia', 'Courier New', 'Times New Roman', 'Arial', 'Roboto', 'Serif'];
const FONT_SIZE_OPTIONS = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '40', '48', '56', '64'];
const FONT_SIZE_COMMAND_MAP = {
  '10': '1',
  '12': '2',
  '14': '3',
  '16': '4',
  '18': '5',
  '20': '6',
  '24': '7'
};
const COMMAND_FONT_SIZE_MAP = {
  1: '10',
  2: '12',
  3: '14',
  4: '16',
  5: '18',
  6: '20',
  7: '24'
};

const NotePanelContent = ({
  draftMode,
  selectedNote,
  editForm,
  setEditForm,
  tagInput,
  setTagInput,
  isAddingTag,
  onStartAddTag,
  onCancelTagInput,
  tagInputRef,
  onAddTag,
  onRemoveTag,
  onDelete,
  onClose
}) => {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const fontDropdownRef = useRef(null);
  const sizeDropdownRef = useRef(null);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('14');
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false
  });
  const [dropdowns, setDropdowns] = useState({
    font: false,
    size: false
  });
  const lastModifiedSource = selectedNote?.updatedAt || selectedNote?.modifiedAt || selectedNote?.createdAt;
  const lastModifiedText =
    !draftMode && lastModifiedSource
      ? new Date(lastModifiedSource).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : 'Not saved yet';

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current &&
      editorRef.current.contains(selection.anchorNode)
    ) {
      selectionRef.current = selection.getRangeAt(0);
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
  }, []);

  const normalizeFontElements = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const fontNodes = editor.querySelectorAll('font');
    fontNodes.forEach((fontNode) => {
      const span = document.createElement('span');
      span.innerHTML = fontNode.innerHTML;
      const face = fontNode.getAttribute('face');
      const sizeAttr = fontNode.getAttribute('size');
      if (face) {
        span.style.fontFamily = face;
      }
      if (sizeAttr && COMMAND_FONT_SIZE_MAP[sizeAttr]) {
        span.style.fontSize = `${COMMAND_FONT_SIZE_MAP[sizeAttr]}px`;
      }
      fontNode.replaceWith(span);
    });
  };

  const updateFormatState = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = window.getSelection();
    if (!selection || !editor.contains(selection.anchorNode)) return;
    saveSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    let fragmentHTML = '';
    if (range && !range.collapsed) {
      const fragment = range.cloneContents();
      const div = document.createElement('div');
      div.appendChild(fragment);
      fragmentHTML = div.innerHTML;
    }
    const containsBold =
      document.queryCommandState('bold') ||
      /<(strong|b)\b/i.test(fragmentHTML) ||
      /font-weight\s*:\s*(bold|[6-9]00)/i.test(fragmentHTML);
    const containsItalic =
      document.queryCommandState('italic') ||
      /<(em|i)\b/i.test(fragmentHTML) ||
      /font-style\s*:\s*italic/i.test(fragmentHTML);
    const containsUnderline =
      document.queryCommandState('underline') ||
      /<u\b/i.test(fragmentHTML) ||
      /text-decoration\s*:\s*(underline|.*underline)/i.test(fragmentHTML);
    const containsOrdered = document.queryCommandState('insertOrderedList') || /<ol\b/i.test(fragmentHTML);
    const containsUnordered = document.queryCommandState('insertUnorderedList') || /<ul\b/i.test(fragmentHTML);

    setFormatState({
      bold: containsBold,
      italic: containsItalic,
      underline: containsUnderline,
      orderedList: containsOrdered,
      unorderedList: containsUnordered
    });
    const currentFont = document.queryCommandValue('fontName');
    if (currentFont) {
      const normalized = currentFont.replace(/['"]/g, '').toLowerCase();
      const match = FONT_OPTIONS.find((option) => option.toLowerCase() === normalized);
      if (match) {
        setFontFamily(match);
      }
    }
    const sizeValue = document.queryCommandValue('fontSize');
    if (sizeValue && COMMAND_FONT_SIZE_MAP[sizeValue]) {
      setFontSize(COMMAND_FONT_SIZE_MAP[sizeValue]);
    }
  }, [saveSelection]);

  useEffect(() => {
    updateFormatState();
    const handleSelectionChange = () => updateFormatState();
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateFormatState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdowns.font &&
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(event.target)
      ) {
        setDropdowns((prev) => ({ ...prev, font: false }));
      }
      if (
        dropdowns.size &&
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target)
      ) {
        setDropdowns((prev) => ({ ...prev, size: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdowns.font, dropdowns.size]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (editForm.body || '')) {
      editorRef.current.innerHTML = editForm.body || '';
    }
  }, [editForm.body]);

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setEditForm((prev) => ({
      ...prev,
      body: html
    }));
  }, [setEditForm]);

  const applyCommand = useCallback(
    (command, value = null) => {
      if (!editorRef.current) return;
      editorRef.current.focus({ preventScroll: true });
      restoreSelection();
      document.execCommand(command, false, value);
      normalizeFontElements();
      saveSelection();
      handleEditorInput();
      updateFormatState();
    },
    [handleEditorInput, updateFormatState, restoreSelection, saveSelection]
  );

  const handleFontFamilyChange = (value) => {
    setFontFamily(value);
    applyCommand('fontName', value);
  };

  const handleFontSizeChange = (value) => {
    setFontSize(value);
    let commandValue = FONT_SIZE_COMMAND_MAP[value];
    if (!commandValue) {
      const numeric = parseInt(value, 10);
      if (numeric <= 12) commandValue = '2';
      else if (numeric <= 14) commandValue = '3';
      else if (numeric <= 16) commandValue = '4';
      else if (numeric <= 18) commandValue = '5';
      else if (numeric <= 20) commandValue = '6';
      else commandValue = '7';
    }
    applyCommand('fontSize', commandValue);
  };

  const handleToolbarMouseDown = (event) => {
    event.preventDefault();
    restoreSelection();
    editorRef.current?.focus({ preventScroll: true });
    saveSelection();
  };

  const toolbarButtonClass = (active) =>
    `text-[14px] font-semibold leading-none px-3 py-1.5 rounded-md transition-colors ${
      active ? 'bg-slate-200/80 text-slate-800' : 'text-slate-700 hover:text-slate-900'
    }`;

  return (
    <div className="flex h-full flex-col transition-all duration-500">
      <div className="flex-1 overflow-y-auto pr-4 pl-3 lg:pl-0 py-4 space-y-4 transition-all duration-500">
        <div className="flex items-start gap-3">
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
            className="flex-1 border-none px-0 text-2xl font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
            placeholder="Title"
          />
          <div className="flex items-center gap-2">
            {!draftMode && selectedNote && (
              <button
                type="button"
                onClick={() => onDelete(selectedNote.id)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Last modified</span>
          <span className="font-semibold text-slate-700">{lastModifiedText}</span>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <p className="text-xs text-slate-500 mt-1 pr-1">Tags</p>
          <div className="flex-1 min-w-[200px] flex flex-wrap items-center gap-2">
            {(editForm.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-3 py-1 text-xs text-slate-700"
              >
                {tag}
                <button
                  type="button"
                  className="text-slate-400 hover:text-rose-500"
                  onClick={() => onRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
            {isAddingTag ? (
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddTag();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelTagInput();
                  }
                }}
                onBlur={() => {
                  if (!tagInput.trim()) {
                    onCancelTagInput();
                  }
                }}
                placeholder="Add tag"
                className="text-xs border border-slate-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            ) : (
              <button
                type="button"
                onClick={onStartAddTag}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300/80 transition-colors"
              >
                + Add tag
              </button>
            )}
          </div>
        </div>
        <div className="h-px bg-slate-200" />
        <div className="flex flex-wrap items-center text-xs text-slate-600 gap-3 relative">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center" ref={fontDropdownRef}>
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() =>
                  setDropdowns((prev) => ({ ...prev, font: !prev.font, size: false }))
                }
                className="flex items-center gap-2 text-[14px] font-semibold text-slate-700 leading-none"
              >
                {fontFamily}
                <ChevronDown size={15} strokeWidth={2.4} className="text-slate-600" />
              </button>
              {dropdowns.font && (
                <div className="absolute top-full left-0 z-30 mt-2 w-36 rounded-lg border border-slate-200 bg-white shadow-lg">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font}
                      type="button"
                      onMouseDown={handleToolbarMouseDown}
                      onClick={() => {
                        handleFontFamilyChange(font);
                        setDropdowns((prev) => ({ ...prev, font: false }));
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] ${
                        font === fontFamily ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div className="relative flex items-center" ref={sizeDropdownRef}>
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() =>
                  setDropdowns((prev) => ({ ...prev, size: !prev.size, font: false }))
                }
                className="flex items-center gap-2 text-[14px] font-semibold text-slate-700 leading-none"
              >
                {fontSize}px
                <ChevronDown size={15} strokeWidth={2.4} className="text-slate-600" />
              </button>
              {dropdowns.size && (
                <div className="absolute top-full left-0 z-30 mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onMouseDown={handleToolbarMouseDown}
                      onClick={() => {
                        handleFontSizeChange(size);
                        setDropdowns((prev) => ({ ...prev, size: false }));
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] ${
                        size === fontSize ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => applyCommand('bold')}
                className={toolbarButtonClass(formatState.bold)}
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => applyCommand('italic')}
                className={`${toolbarButtonClass(formatState.italic)} italic font-serif leading-none`}
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => applyCommand('underline')}
                className={`${toolbarButtonClass(formatState.underline)} underline decoration-[2px] underline-offset-2`}
              >
                U
              </button>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => applyCommand('insertOrderedList')}
                className={`${toolbarButtonClass(formatState.orderedList)} flex items-center gap-1`}
                title="Ordered list"
              >
                <ListOrdered size={16} />
              </button>
              <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => applyCommand('insertUnorderedList')}
                className={`${toolbarButtonClass(formatState.unorderedList)} flex items-center gap-1`}
                title="Bullet list"
              >
                <List size={16} />
              </button>
            </div>
            <div className="h-5 w-px bg-slate-200" />
          </div>
        </div>
        <div className="h-px bg-slate-100" />
        <div
          ref={editorRef}
          className="note-editor min-h-[280px] w-full border border-transparent focus:outline-none focus:ring-0 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          data-placeholder="Start writing your note..."
        />
      </div>
    </div>
  );
};

export default ContextNotes;
