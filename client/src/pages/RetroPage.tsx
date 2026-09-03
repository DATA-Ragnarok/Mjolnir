import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RetroNoteModal from '../components/RetroNoteModal';
import { RetroNote, Sprint } from '../types';
import { retroService } from '../services/retroService';

type NoteModalState = {
  open: boolean;
  note: RetroNote | null;
};

function getAuthorLabel(note: RetroNote) {
  if (typeof note.authorId === 'string') {
    return 'Unknown';
  }

  if (!note.authorId.name) {
    return note.authorId.email;
  }

  return note.authorId.name;
}

function getCoinText(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

const RetroPage: React.FC = () => {
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [notes, setNotes] = useState<RetroNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<NoteModalState>({ open: false, note: null });

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

    const fetchedNotes = await retroService.getNotesBySprint(sprintId);
    setNotes(fetchedNotes);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading retro board...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Retro</h1>
          <p className="text-gray-500 text-sm mt-1">Capture sprint insights and run structured retrospectives.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Add Note
          </button>
          <button
            type="button"
            onClick={handleStartRetro}
            disabled={!selectedSprintId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start Retro
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Sprint Selector</label>
        <select
          value={selectedSprintId}
          onChange={(event) => setSelectedSprintId(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          {sprints.map((sprint) => (
            <option key={sprint._id} value={sprint._id}>
              {sprint.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSprint ? (
        <p className="text-sm text-gray-600">Retro board for {selectedSprint.name}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No retro notes yet. Add your first discussion note.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const author = getAuthorLabel(note);
            const coin = getCoinText(author);

            return (
              <button
                key={note._id}
                type="button"
                onClick={() => openEditModal(note)}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-gray-900">{note.title}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {coin}
                  </span>
                  <p className="text-xs text-gray-500">written by {author}</p>
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
