import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import RetroNoteModal from '../components/RetroNoteModal';
import { RetroNote, Sprint } from '../types';
import { retroService } from '../services/retroService';
import { getInitialsFromName } from '../utils/initials';

type NoteModalState = {
    open: boolean;
    note: RetroNote | null;
};

function getAuthorName(note: RetroNote) {
    if (typeof note.authorId === 'string') {
        return 'Unknown';
    }

    if (!note.authorId?.name) {
        return note.authorId?.email ?? 'Unknown';
    }

    return note.authorId.name;
}

const RetroPage: React.FC = () => {
    const navigate = useNavigate();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>('');
    const [notes, setNotes] = useState<RetroNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalState, setModalState] = useState<NoteModalState>({ open: false, note: null });

    const activeSprint = useMemo(() => {
        const now = new Date();
        return sprints.find((sprint) => new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now) || sprints[0];
    }, [sprints]);

    const selectedSprint = useMemo(
        () => sprints.find((sprint) => sprint._id === selectedSprintId) ?? null,
        [selectedSprintId, sprints],
    );

    const loadBootstrap = async () => {
        const bootstrap = await retroService.getBootstrap();
        setSprints(bootstrap.sprints);
        const fallbackSprintId = bootstrap.currentSprintId ?? bootstrap.sprints[0]?._id ?? '';
        setSelectedSprintId((current) => current || fallbackSprintId);
    };

    const loadNotes = async (sprintId: string) => {
        if (!sprintId) {
            setNotes([]);
            return;
        }

        setLoadingNotes(true);
        try {
            const fetchedNotes = await retroService.getNotesBySprint(sprintId);
            setNotes(fetchedNotes);
        } finally {
            setLoadingNotes(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            setError(null);
            try {
                await loadBootstrap();
            } catch (bootstrapError) {
                console.error(bootstrapError);
                setError('Failed to load retro board.');
            } finally {
                setLoading(false);
            }
        };

        void initialize();
    }, []);

    useEffect(() => {
        if (!selectedSprintId) return;

        const refresh = async () => {
            try {
                await loadNotes(selectedSprintId);
            } catch (notesError) {
                console.error(notesError);
                setError('Failed to load notes.');
            }
        };

        void refresh();
        const intervalId = window.setInterval(() => {
            void refresh();
        }, 5000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [selectedSprintId]);

    const openCreateModal = () => {
        setModalState({ open: true, note: null });
    };

    const openEditModal = (note: RetroNote) => {
        setModalState({ open: true, note });
    };

    const closeModal = () => {
        setModalState({ open: false, note: null });
    };

    const handleSave = async (payload: { title: string; description: string; sprintId: string }) => {
        if (modalState.note) {
            await retroService.updateNote(modalState.note._id, payload);
        } else {
            await retroService.createNote(payload);
        }

        if (payload.sprintId === selectedSprintId) {
            await loadNotes(selectedSprintId);
        }
    };

    const handleDelete = async () => {
        if (!modalState.note) return;

        await retroService.deleteNote(modalState.note._id);
        await loadNotes(selectedSprintId);
    };

    const handleStartRetro = () => {
        if (!selectedSprintId) return;
        navigate(`/retro/session/${selectedSprintId}`);
    };

    if (loading && sprints.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Team retros</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Retro</h1>
                    <p className="mt-1 text-sm text-gray-500">Capture sprint insights and run structured retrospectives.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Add Note
                    </button>
                    <button
                        type="button"
                        onClick={handleStartRetro}
                        disabled={!selectedSprintId}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Start Retro
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Calendar size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sprint</p>
                            <select
                                value={selectedSprintId}
                                onChange={(event) => setSelectedSprintId(event.target.value)}
                                className="mt-1 w-full cursor-pointer border-none bg-transparent p-0 text-base font-semibold text-slate-900 outline-none focus:ring-0"
                            >
                                <option value="">Select sprint</option>
                                {sprints.map((sprint) => (
                                    <option key={sprint._id} value={sprint._id}>
                                        {sprint.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {activeSprint && selectedSprintId === activeSprint._id && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Active Now
                        </span>
                    )}
                </div>
            </div>

            {selectedSprint ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                    Retro board for <span className="font-semibold">{selectedSprint.name}</span>
                </div>
            ) : null}
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            {loadingNotes && notes.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
                </div>
            ) : notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-lg font-bold text-indigo-600">
                        +
                    </div>
                    <p className="text-base font-semibold text-slate-700">No retro notes yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add your first discussion note to capture team feedback.</p>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                        Add Note
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {notes.map((note) => {
                        const authorName = getAuthorName(note);
                        const initials = getInitialsFromName(authorName);

                        return (
                            <button
                                key={note._id}
                                type="button"
                                onClick={() => openEditModal(note)}
                                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-base font-semibold text-slate-900">{note.title}</h3>
                                    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                                        Note
                                    </span>
                                </div>

                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                                    {note.description?.trim() || 'No additional notes provided.'}
                                </p>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                    <div className="text-xs font-medium text-slate-500">By {authorName}</div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[11px] font-bold text-indigo-700 shadow-sm">
                                        {initials || '?'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <RetroNoteModal
                isOpen={modalState.open}
                sprints={sprints}
                initialTitle={modalState.note?.title ?? ''}
                initialDescription={modalState.note?.description ?? ''}
                initialSprintId={modalState.note?.sprintId ?? selectedSprintId}
                canDelete={Boolean(modalState.note)}
                onClose={closeModal}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default RetroPage;
