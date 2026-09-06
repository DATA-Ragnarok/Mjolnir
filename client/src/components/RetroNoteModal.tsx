import { useEffect, useMemo, useState } from 'react';
import { RETRO_NOTE_CATEGORIES, RetroNoteCategory, Sprint } from '../types';

type RetroNoteModalProps = {
    isOpen: boolean;
    sprints: Sprint[];
    initialTitle?: string;
    initialDescription?: string;
    initialCategory?: RetroNoteCategory;
    initialSprintId: string;
    canDelete: boolean;
    onClose: () => void;
    onSave: (payload: { title: string; description: string; category: RetroNoteCategory; sprintId: string }) => Promise<void>;
    onDelete: () => Promise<void>;
};

function RetroNoteModal({
    isOpen,
    sprints,
    initialTitle = '',
    initialDescription = '',
    initialCategory = 'Note',
    initialSprintId,
    canDelete,
    onClose,
    onSave,
    onDelete,
}: RetroNoteModalProps) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [category, setCategory] = useState<RetroNoteCategory>(initialCategory);
    const [sprintId, setSprintId] = useState(initialSprintId);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setTitle(initialTitle);
        setDescription(initialDescription);
        setCategory(initialCategory);
        setSprintId(initialSprintId);
        setError(null);
    }, [isOpen, initialTitle, initialDescription, initialCategory, initialSprintId]);

    const isValid = useMemo(() => {
        return title.trim().length > 0 && description.trim().length > 0 && sprintId.length > 0;
    }, [title, description, sprintId]);

    const handleSave = async () => {
        if (!isValid) {
            setError('Title, description, and sprint are required.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await onSave({ title: title.trim(), description: description.trim(), category, sprintId });
            onClose();
        } catch (saveError) {
            console.error(saveError);
            setError('Could not save note.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await onDelete();
            onClose();
        } catch (deleteError) {
            console.error(deleteError);
            setError('Could not delete note.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-gray-900">Retro Note</h3>

                <div className="mt-4 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                            placeholder="What happened?"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                            placeholder="Add context for discussion"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                        <div className="mt-2 inline-flex w-full rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
                            {RETRO_NOTE_CATEGORIES.map((option) => {
                                const isSelected = category === option;
                                const palette =
                                    option === 'Keep'
                                        ? 'text-emerald-700'
                                        : option === 'Improve'
                                            ? 'text-amber-700'
                                            : 'text-blue-700';
                                const selectedPalette =
                                    option === 'Keep'
                                        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                        : option === 'Improve'
                                            ? 'bg-amber-100 text-amber-700 shadow-sm'
                                            : 'bg-blue-100 text-blue-700 shadow-sm';

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setCategory(option)}
                                        className={[
                                            'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200',
                                            isSelected ? selectedPalette : `${palette} hover:bg-white/80`,
                                        ].join(' ')}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Sprint Retro Selection</label>
                        <select
                            value={sprintId}
                            onChange={(event) => setSprintId(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        >
                            {sprints.map((sprint) => (
                                <option key={sprint._id} value={sprint._id}>
                                    {sprint.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

                <div className="mt-6 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={!canDelete || isSubmitting}
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Delete
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RetroNoteModal;
