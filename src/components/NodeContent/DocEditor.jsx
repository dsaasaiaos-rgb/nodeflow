import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, History, ChevronDown, Wand2, CheckCheck, BookOpen } from 'lucide-react';

const DOC_LABELS = {
    agreement: 'Service Agreement',
    sow: 'Statement of Work',
    oosw: 'Out of Scope Work (Billable)',
    siteCode: 'Technical Implementation Notes',
};

const DOC_SUGGESTIONS = {
    agreement: ['Payment terms clause', 'Intellectual property clause', 'Termination clause', 'Confidentiality clause'],
    sow: ['Project timeline section', 'Deliverables list', 'Acceptance criteria', 'Revision policy'],
    oosw: ['Hourly rate schedule', 'Change request process', 'Common out-of-scope examples'],
    siteCode: ['Environment setup steps', 'Deployment checklist', 'API integration notes', 'Tech stack details'],
};

export default function DocEditor({ docKey, node, content, onSave, onShowHistory, readOnly = false }) {
    const [localContent, setLocalContent] = useState(content || '');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAction, setAiAction] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const label = DOC_LABELS[docKey] || docKey;

    const callAI = async (action, extraPrompt = '') => {
        setAiLoading(true);
        setAiAction(action);
        const prompts = {
            generate: `You are an expert contract and technical writer. The project is named "${node.name}" and described as: "${node.description}" (URL: ${node.url}).
Generate a complete, professional ${label} document for this project. Include all standard sections with detailed placeholder content that can be customized. Format with clear headings and subsections.`,
            polish: `You are a legal and technical writing expert. Rewrite the following ${label} to be more professional, clear, and well-structured. Fix grammar, improve tone, ensure consistency.
Keep the original intent intact.\n\nOriginal:\n${localContent}`,
            grammarCheck: `Review the following ${label} for grammar, style, clarity, and professional tone issues. List specific improvements as bullet points, then provide the corrected full document after a line "---CORRECTED---".\n\nDocument:\n${localContent}`,
            suggest: extraPrompt,
        };
        const { data } = await base44.functions.invoke('generateGeminiResponse', { prompt: prompts[action] });
        setAiLoading(false);
        setAiAction(null);
        if (!data?.text) return;
        if (action === 'grammarCheck') {
            const parts = data.text.split('---CORRECTED---');
            if (parts.length === 2) {
                alert('Grammar Check Suggestions:\n\n' + parts[0].trim());
                const corrected = parts[1].trim();
                setLocalContent(corrected);
                onSave(docKey, corrected);
            } else {
                alert('Grammar Check:\n\n' + data.text);
            }
        } else {
            setLocalContent(data.text);
            onSave(docKey, data.text);
        }
    };

    const handleSuggestClause = async (suggestion) => {
        setShowSuggestions(false);
        setAiLoading(true);
        setAiAction('suggest');
        const prompt = `For a ${label} document for the project "${node.name}" (${node.description}), write a professional "${suggestion}" section/clause that can be appended to an existing document. Format it clearly with a heading and detailed content.`;
        const { data } = await base44.functions.invoke('generateGeminiResponse', { prompt });
        setAiLoading(false);
        setAiAction(null);
        if (data?.text) {
            const newContent = localContent ? localContent + '\n\n' + data.text : data.text;
            setLocalContent(newContent);
            onSave(docKey, newContent);
        }
    };

    const isEmpty = !localContent?.trim();

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-4">
            {readOnly && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <Eye className="w-3.5 h-3.5" />
                    You have read-only access to this document
                </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-lg font-bold text-gray-900 dark:text-white">{label}</Label>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onShowHistory(docKey)} variant="outline" size="sm" className="text-xs gap-1.5">
                        <History className="w-3 h-3" /> History
                    </Button>
                    {/* Suggest Clause */}
                    <div className="relative">
                        <Button
                            onClick={() => setShowSuggestions(s => !s)}
                            variant="outline" size="sm"
                            className="text-xs gap-1.5 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400"
                            disabled={aiLoading}
                        >
                            <BookOpen className="w-3 h-3" /> Suggest <ChevronDown className="w-3 h-3" />
                        </Button>
                        {showSuggestions && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
                                {(DOC_SUGGESTIONS[docKey] || []).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleSuggestClause(s)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                    >
                                        + {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Grammar Check */}
                    {!isEmpty && (
                        <Button
                            onClick={() => callAI('grammarCheck')}
                            disabled={aiLoading}
                            variant="outline" size="sm"
                            className="text-xs gap-1.5 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                        >
                            {aiLoading && aiAction === 'grammarCheck' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                            Check
                        </Button>
                    )}
                    {/* Polish */}
                    {!isEmpty && (
                        <Button
                            onClick={() => callAI('polish')}
                            disabled={aiLoading}
                            size="sm"
                            className="text-xs gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none"
                        >
                            {aiLoading && aiAction === 'polish' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            Polish
                        </Button>
                    )}
                    {/* Generate */}
                    {isEmpty && (
                        <Button
                            onClick={() => callAI('generate')}
                            disabled={aiLoading}
                            size="sm"
                            className="text-xs gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                        >
                            {aiLoading && aiAction === 'generate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Generate with AI
                        </Button>
                    )}
                </div>
            </div>

            {isEmpty && !aiLoading && (
                <div
                    onClick={() => callAI('generate')}
                    className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group"
                >
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Generate {label} with AI</p>
                    <p className="text-xs text-gray-400 mt-1">Click to auto-generate based on node metadata</p>
                </div>
            )}

            {aiLoading && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">
                        {aiAction === 'generate' ? 'Generating document...' : aiAction === 'grammarCheck' ? 'Checking grammar & style...' : aiAction === 'suggest' ? 'Writing clause...' : 'Polishing document...'}
                    </span>
                </div>
            )}

            <textarea
                value={localContent}
                onChange={e => setLocalContent(e.target.value)}
                onBlur={() => onSave(docKey, localContent)}
                className={`min-h-[500px] w-full rounded-xl p-4 text-sm leading-relaxed resize-y border focus:ring-2 focus:ring-indigo-500 outline-none font-mono ${
                    docKey === 'siteCode'
                        ? 'bg-slate-900 text-slate-100 border-slate-700'
                        : docKey === 'oosw'
                        ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-gray-800 dark:text-yellow-100'
                        : 'bg-gray-900 text-gray-100 border-gray-700'
                }`}
                placeholder={`Enter ${label} content here, or click "Generate with AI" to auto-populate...`}
            />
        </div>
    );
}