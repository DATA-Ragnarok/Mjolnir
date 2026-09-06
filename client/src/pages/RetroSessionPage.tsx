import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, Check, Info, X } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { RetroActionItem, RetroActionItemStatus, RetroSessionData } from '../types';
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

function formatDurationAsDays(hours: number) {
    const days = hours / 8;
    const wholeDays = Math.floor(days);
    const remainder = days - wholeDays;

    if (days === 0) return '0d';
    if (remainder === 0) return `${wholeDays}d`;
    if (Math.abs(remainder - 0.5) < 0.001) return `${wholeDays + 0.5}d`;
    return `${days.toFixed(1)}d`;
}

const StatsInfoModalContent: React.FC = () => (
    <div className="space-y-5 p-6">
        <div>
            <h3 className="text-xl font-bold text-gray-900">Sprint statistics guide</h3>
            <p className="mt-1 text-sm text-gray-600">These numbers summarize how the sprint flowed and where work stalled.</p>
        </div>

        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Cycle Time</p>
                <p className="mt-2 text-sm text-gray-700">The average time from a story entering progress until it is marked Done. Lower is better, and it helps estimate delivery speed.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Throughput</p>
                <p className="mt-2 text-sm text-gray-700">The number of stories completed in this sprint. It is a simple measure of how much value the team delivered.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Blocked Time</p>
                <p className="mt-2 text-sm text-gray-700">Blocked work is counted only during the team’s working window: Sunday through Thursday, from 9:30 AM to 5:30 PM. Time is shown in work-days, where 8 hours = 1 day and 4 hours = 0.5 day.</p>
            </div>
        </div>
    </div>
);

const RetroSessionPage: React.FC = () => {
    const { sprintId = '' } = useParams<{ sprintId: string }>();
    const { openModal } = useModal();
    const [step, setStep] = useState<Step>(1);
    const [sessionData, setSessionData] = useState<RetroSessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>(['', '', '']);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [previousItemStatuses, setPreviousItemStatuses] = useState<Record<string, RetroActionItemStatus>>({});

    const canGoNext = step < 4;

    const reviewedPreviousItems = useMemo(
        () => sessionData?.previousActionItems.filter((item) => item.content.trim().length > 0) ?? [],
        [sessionData],
    );

    const filledSlotCount = useMemo(
        () => slots.filter((slot) => slot.trim().length > 0).length,
        [slots],
    );

    const allPreviousItemsReviewed = useMemo(
        () => reviewedPreviousItems.length === 0 || reviewedPreviousItems.every((item) => Boolean(previousItemStatuses[item._id])),
        [reviewedPreviousItems, previousItemStatuses],
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
        setPreviousItemStatuses(
            sessionData.previousActionItems.reduce<Record<string, RetroActionItemStatus>>((accumulator, item) => {
                if (item.content.trim().length > 0) {
                    accumulator[item._id] = item.status;
                }
                return accumulator;
            }, {}),
        );
    }, [sessionData]);

    const savePreviousActionItemStatuses = async () => {
        if (!sessionData?.previousSprint || reviewedPreviousItems.length === 0) {
            return;
        }

        const previousItemsForSave = Array.from({ length: 3 }, (_, slotIndex) => {
            const item = sessionData.previousActionItems.find((previousItem) => previousItem.slot === slotIndex);
            if (!item) {
                return { content: '', status: 'To Do' as RetroActionItemStatus };
            }

            return {
                content: item.content,
                status: previousItemStatuses[item._id] ?? item.status ?? 'To Do',
            };
        });

        await retroService.saveActionItems(sessionData.previousSprint._id, previousItemsForSave);
    };

    const handleNext = async () => {
        if (step === 1 && !allPreviousItemsReviewed) {
            setSaveError('Select a state for every previous action item before continuing.');
            return;
        }

        setSaveError(null);

        if (step === 1) {
            try {
                await savePreviousActionItemStatuses();
            } catch (saveErrorEvent) {
                console.error(saveErrorEvent);
                setSaveError('Could not save previous action item states.');
                return;
            }
        }

        if (step < 4) setStep((current) => (current + 1) as Step);
    };

    const handleBack = () => {
        if (step > 1) setStep((current) => (current - 1) as Step);
    };

    const handleSlotChange = (index: number, value: string) => {
        setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? value : slot)));
    };

    const handlePreviousStatusChange = (itemId: string, value: RetroActionItemStatus) => {
        setPreviousItemStatuses((current) => ({ ...current, [itemId]: value }));
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
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
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
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Retro Session</p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{sessionData.sprint.name}</h2>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Step {step} of 4
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    {Object.entries(STEP_TITLES).map(([stepKey, title]) => {
                        const stepValue = Number(stepKey) as Step;
                        const active = stepValue === step;
                        const complete = stepValue < step;

                        return (
                            <button
                                key={stepKey}
                                type="button"
                                onClick={() => stepValue < step && setStep(stepValue)}
                                disabled={stepValue > step}
                                className={[
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition',
                                    active
                                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                                        : complete
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-200 bg-slate-50 text-slate-500',
                                    stepValue > step ? 'cursor-not-allowed opacity-60' : '',
                                ].join(' ')}
                            >
                                {title}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {step === 1 ? (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Past Retro Action Items</h3>
                        <p className="mt-1 text-sm text-slate-600">Mark each action item as nailed, still to do, or ignore it from now on.</p>
                        {sessionData.previousSprint ? (
                            <p className="mt-2 text-sm text-slate-600">From sprint: {sessionData.previousSprint.name}</p>
                        ) : (
                            <p className="mt-2 text-sm text-slate-600">No previous sprint found.</p>
                        )}

                        <ul className="mt-4 space-y-3">
                            {reviewedPreviousItems.length === 0 ? (
                                <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                    No previous action items recorded.
                                </li>
                            ) : (
                                reviewedPreviousItems.map((item) => {
                                    const selectedStatus = previousItemStatuses[item._id];
                                    const toggleOptions: Array<{
                                        value: RetroActionItemStatus;
                                        icon: React.ReactNode;
                                        activeClass: string;
                                        inactiveClass: string;
                                    }> = [
                                            {
                                                value: 'Done',
                                                icon: <Check size={16} strokeWidth={3} />,
                                                activeClass: 'bg-emerald-100 text-emerald-700',
                                                inactiveClass: 'text-slate-500 hover:bg-slate-100',
                                            },
                                            {
                                                value: 'To Do',
                                                icon: <X size={16} strokeWidth={3} />,
                                                activeClass: 'bg-red-100 text-red-700',
                                                inactiveClass: 'text-slate-500 hover:bg-slate-100',
                                            },
                                            {
                                                value: 'Ignored',
                                                icon: <Ban size={16} strokeWidth={3} />,
                                                activeClass: 'bg-amber-100 text-amber-700',
                                                inactiveClass: 'text-slate-500 hover:bg-slate-100',
                                            },
                                        ];

                                    return (
                                        <li
                                            key={item._id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <p className="text-sm leading-6 text-slate-700">{item.content}</p>
                                                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                                                    {toggleOptions.map((option) => {
                                                        const isSelected = selectedStatus === option.value;

                                                        return (
                                                            <button
                                                                key={`${item._id}-${option.value}`}
                                                                type="button"
                                                                aria-label={option.value}
                                                                onClick={() => handlePreviousStatusChange(item._id, option.value)}
                                                                className={[
                                                                    'flex h-9 w-9 items-center justify-center rounded-full transition',
                                                                    isSelected ? option.activeClass : option.inactiveClass,
                                                                ].join(' ')}
                                                            >
                                                                {option.icon}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                ) : null}

                {step === 2 ? (
                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-slate-900">Sprint Statistics</h3>
                            <button
                                type="button"
                                aria-label="Statistics info"
                                onClick={() => openModal(<StatsInfoModalContent />, { maxWidth: 'lg', ribbonColor: 'bg-indigo-600' })}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                            >
                                <Info size={16} />
                            </button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Cycle Time</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">{formatDurationAsDays(sessionData.stats.cycleTimeHours)}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Throughput</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">{sessionData.stats.throughput}</p>
                            </div>
                        </div>

                        <h4 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Blocked Time / Aging Work</h4>
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Story</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Blocked Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {sessionData.stats.blockedAging.length === 0 ? (
                                        <tr>
                                            <td className="px-3 py-3 text-slate-500" colSpan={2}>
                                                No blocked aging data in this sprint.
                                            </td>
                                        </tr>
                                    ) : (
                                        sessionData.stats.blockedAging.map((row) => (
                                            <tr key={row.storyId}>
                                                <td className="px-3 py-2 text-slate-800">{row.title}</td>
                                                <td className="px-3 py-2 text-slate-700">{formatDurationAsDays(row.blockedHours)}</td>
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
                        <h3 className="text-lg font-semibold text-slate-900">Discussion View</h3>
                        <div className="mt-4 space-y-3">
                            {sessionData.notes.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                    No discussion notes yet.
                                </p>
                            ) : (
                                sessionData.notes.map((note) => (
                                    <article key={note._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                                        <h4 className="text-base font-semibold text-slate-900">{note.title}</h4>
                                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{note.description}</p>
                                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
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
                        <h3 className="text-lg font-semibold text-slate-900">Create Action Items</h3>
                        <p className="mt-1 text-sm text-slate-600">Exactly 3 slots. At least 2 slots are required. New items default to To Do.</p>

                        <div className="mt-4 space-y-3">
                            {slots.map((slot, index) => (
                                <div key={`slot-${index}`}>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Action Item {index + 1}</label>
                                    <input
                                        value={slot}
                                        onChange={(event) => handleSlotChange(index, event.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white"
                                        placeholder="Define an improvement action"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            <span>Filled slots</span>
                            <span className="rounded-full bg-white px-2 py-1 text-slate-700">{filledSlotCount}/3</span>
                        </div>
                        {saveError ? <p className="mt-3 text-sm font-medium text-red-600">{saveError}</p> : null}
                        {saveSuccess ? <p className="mt-3 text-sm font-medium text-emerald-600">{saveSuccess}</p> : null}
                    </div>
                ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Back
                </button>

                {canGoNext ? (
                    <button
                        type="button"
                        onClick={() => void handleNext()}
                        disabled={step === 1 && !allPreviousItemsReviewed}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={filledSlotCount < 2}
                        onClick={async () => {
                            if (step === 1 && !allPreviousItemsReviewed) {
                                setSaveError('Select a state for every previous action item before finishing.');
                                return;
                            }

                            if (step === 1) {
                                try {
                                    await savePreviousActionItemStatuses();
                                } catch (saveErrorEvent) {
                                    console.error(saveErrorEvent);
                                    setSaveError('Could not save previous action item states.');
                                    return;
                                }
                            }

                            if (step === 4) {
                                try {
                                    setSaveError(null);
                                    setSaveSuccess(null);
                                    await saveActionItems();
                                    if (filledSlotCount < 2) {
                                        return;
                                    }
                                } catch (saveActionError) {
                                    console.error(saveActionError);
                                    setSaveError('Could not save action items.');
                                    return;
                                }
                            }

                            if (filledSlotCount < 2) {
                                setSaveError('Add at least 2 action items before finishing.');
                                return;
                            }
                            window.location.href = '/retro';
                        }}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        Finish
                    </button>
                )}
            </div>
        </div>
    );
};

export default RetroSessionPage;
