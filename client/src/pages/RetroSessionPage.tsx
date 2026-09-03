import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RetroActionItem, RetroSessionData } from '../types';
import { retroService } from '../services/retroService';

type Step = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  1: 'Past Retro Action Items',
  2: 'Sprint Statistics',
  3: 'Discussion View',
  4: 'Create Action Items',
};

function toSlots(items: RetroActionItem[]) {
  const slots = ['', '', ''];

  for (const item of items) {
    if (item.slot >= 0 && item.slot <= 2) {
      slots[item.slot] = item.content;
    }
  }

  return slots;
}

const RetroSessionPage: React.FC = () => {
  const { sprintId = '' } = useParams<{ sprintId: string }>();
  const [step, setStep] = useState<Step>(1);
  const [sessionData, setSessionData] = useState<RetroSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>(['', '', '']);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const canGoNext = step < 4;

  const filledSlotCount = useMemo(
    () => slots.filter((slot) => slot.trim().length > 0).length,
    [slots],
  );

  const loadSession = async () => {
    if (!sprintId) {
      setError('Invalid sprint link.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await retroService.getSessionData(sprintId);
      setSessionData(response);
    } catch (sessionError) {
      console.error(sessionError);
      setError('Could not load retro session data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, [sprintId]);

  useEffect(() => {
    if (!sessionData) return;
    setSlots(toSlots(sessionData.currentActionItems));
  }, [sessionData]);

  const handleNext = () => {
    if (step < 4) setStep((current) => (current + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((current) => (current - 1) as Step);
  };

  const handleSlotChange = (index: number, value: string) => {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? value : slot)));
  };

  const saveActionItems = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (filledSlotCount < 2) {
      setSaveError('At least 2 action item slots are required.');
      return;
    }

    try {
      await retroService.saveActionItems(
        sprintId,
        slots.map((content) => ({ content, status: 'To Do' })),
      );
      setSaveSuccess('Action items saved for next sprint.');
    } catch (actionItemError) {
      console.error(actionItemError);
      setSaveError('Could not save action items.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading retro session...</div>;
  }

  if (error || !sessionData) {
    return (
      <div>
        <p className="text-sm text-red-600">{error ?? 'Retro session unavailable.'}</p>
        <Link to="/retro" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Back to Retro
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Retro Session</p>
        <h2 className="text-xl font-bold text-gray-900">{sessionData.sprint.name}</h2>
        <p className="mt-1 text-sm text-gray-600">Step {step} of 4: {STEP_TITLES[step]}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        {step === 1 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Past Retro Action Items</h3>
            {sessionData.previousSprint ? (
              <p className="mt-1 text-sm text-gray-600">From sprint: {sessionData.previousSprint.name}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">No previous sprint found.</p>
            )}

            <ul className="mt-4 space-y-2">
              {sessionData.previousActionItems.filter((item) => item.content.trim().length > 0).length === 0 ? (
                <li className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                  No previous action items recorded.
                </li>
              ) : (
                sessionData.previousActionItems
                  .filter((item) => item.content.trim().length > 0)
                  .map((item) => (
                    <li key={item._id} className="rounded-md border border-gray-200 p-3 text-sm text-gray-800">
                      {item.content}
                    </li>
                  ))
              )}
            </ul>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sprint Statistics</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cycle Time</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{sessionData.stats.cycleTimeHours}h</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Throughput</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{sessionData.stats.throughput}</p>
              </div>
            </div>

            <h4 className="mt-5 text-sm font-semibold uppercase tracking-wider text-gray-600">Blocked Time / Aging Work</h4>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Story</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Blocked Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sessionData.stats.blockedAging.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-gray-500" colSpan={2}>
                        No blocked aging data in this sprint.
                      </td>
                    </tr>
                  ) : (
                    sessionData.stats.blockedAging.map((row) => (
                      <tr key={row.storyId}>
                        <td className="px-3 py-2 text-gray-800">{row.title}</td>
                        <td className="px-3 py-2 text-gray-700">{row.blockedHours}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Discussion View</h3>
            <div className="mt-4 space-y-3">
              {sessionData.notes.length === 0 ? (
                <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                  No discussion notes yet.
                </p>
              ) : (
                sessionData.notes.map((note) => (
                  <article key={note._id} className="rounded-lg border border-gray-200 p-4">
                    <h4 className="text-base font-semibold text-gray-900">{note.title}</h4>
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{note.description}</p>
                    <p className="mt-3 text-xs text-gray-500">
                      Author: {typeof note.authorId === 'string' ? 'Unknown' : note.authorId.name}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create Action Items</h3>
            <p className="mt-1 text-sm text-gray-600">Exactly 3 slots. At least 2 slots are required.</p>

            <div className="mt-4 space-y-3">
              {slots.map((slot, index) => (
                <div key={`slot-${index}`}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Action Item {index + 1}</label>
                  <input
                    value={slot}
                    onChange={(event) => handleSlotChange(index, event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    placeholder="Define an improvement action"
                  />
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-500">Filled slots: {filledSlotCount}/3</p>
            {saveError ? <p className="mt-2 text-sm text-red-600">{saveError}</p> : null}
            {saveSuccess ? <p className="mt-2 text-sm text-green-600">{saveSuccess}</p> : null}

            <button
              type="button"
              onClick={saveActionItems}
              className="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Save Action Items
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {canGoNext ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Next
          </button>
        ) : (
          <Link to="/retro" className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">
            Finish
          </Link>
        )}
      </div>
    </div>
  );
};

export default RetroSessionPage;
