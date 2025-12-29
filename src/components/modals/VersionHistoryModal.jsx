import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { History, Loader2, RotateCcw, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function VersionHistoryModal({ nodeId, docKey, currentContent, onClose, onRevert }) {
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [isReverting, setIsReverting] = useState(false);

    const docLabels = {
        'agreement': 'Agreement',
        'sow': 'Statement of Work',
        'oosw': 'Out of Scope Work',
        'siteCode': 'Site Code'
    };

    useEffect(() => {
        loadVersions();
    }, []);

    const loadVersions = async () => {
        setIsLoading(true);
        try {
            const { data } = await base44.functions.invoke('getDocVersions', { nodeId, key: docKey });
            setVersions(data.versions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevert = async (version) => {
        setIsReverting(true);
        try {
            await onRevert(version.content);
            onClose();
        } catch (e) {
            alert("Failed to revert: " + e.message);
        } finally {
            setIsReverting(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPreview = (content, maxLength = 150) => {
        if (!content) return 'Empty';
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Version History</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{docLabels[docKey] || docKey}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No previous versions</p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                                Version history will appear here after you save changes.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Current Version */}
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                                            CURRENT
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Now</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    {getPreview(currentContent)}
                                </p>
                            </div>

                            {/* Previous Versions */}
                            {versions.map((version, index) => (
                                <motion.div
                                    key={version.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                                >
                                    <div 
                                        className="p-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                                        onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                                                    v{versions.length - index}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {formatDate(version.created_date)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        by {version.savedByName || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRevert(version);
                                                    }}
                                                    disabled={isReverting}
                                                    className="text-xs"
                                                >
                                                    {isReverting ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="w-3 h-3 mr-1" />
                                                            Revert
                                                        </>
                                                    )}
                                                </Button>
                                                {expandedId === version.id ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {expandedId !== version.id && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 truncate">
                                                {getPreview(version.content, 100)}
                                            </p>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {expandedId === version.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Content</span>
                                                    </div>
                                                    <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-4 rounded-lg max-h-64 overflow-auto whitespace-pre-wrap">
                                                        {version.content || 'Empty'}
                                                    </pre>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {versions.length} previous version{versions.length !== 1 ? 's' : ''} saved
                        </p>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}