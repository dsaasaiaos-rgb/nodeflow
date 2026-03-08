import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Database, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotionSync({ user }) {
    const [nodes, setNodes] = useState([]);
    const [databases, setDatabases] = useState([]);
    const [selectedDb, setSelectedDb] = useState('');
    const [loadingDbs, setLoadingDbs] = useState(false);
    const [syncingNodeId, setSyncingNodeId] = useState(null);
    const [results, setResults] = useState({});
    const [dbError, setDbError] = useState('');

    useEffect(() => {
        loadNodes();
    }, []);

    const loadNodes = async () => {
        const { data } = await base44.functions.invoke('listMyNodes');
        setNodes(data.nodes || []);
    };

    const loadDatabases = async () => {
        setLoadingDbs(true);
        setDbError('');
        const { data } = await base44.functions.invoke('notionSync', { action: 'listDatabases' });
        setLoadingDbs(false);
        if (data.error) { setDbError(data.error); return; }
        setDatabases(data.databases || []);
        if (data.databases?.length > 0) setSelectedDb(data.databases[0].id);
    };

    const syncNode = async (nodeId) => {
        if (!selectedDb) { alert('Please select a Notion database first.'); return; }
        setSyncingNodeId(nodeId);
        const { data } = await base44.functions.invoke('notionSync', { action: 'syncNode', databaseId: selectedDb, nodeId });
        setSyncingNodeId(null);
        setResults(prev => ({ ...prev, [nodeId]: data }));
    };

    const syncAll = async () => {
        for (const node of nodes) {
            await syncNode(node.id);
        }
    };

    const statusColors = {
        Active: 'bg-green-500/20 text-green-400 border-green-700',
        'In Progress': 'bg-indigo-500/20 text-indigo-400 border-indigo-700',
        'On Hold': 'bg-yellow-500/20 text-yellow-400 border-yellow-700',
        Completed: 'bg-blue-500/20 text-blue-400 border-blue-700',
    };

    return (
        <div className="space-y-6">
            {/* DB Picker */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-gray-300" />
                    Notion Database
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <Button onClick={loadDatabases} disabled={loadingDbs} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        {loadingDbs ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><RefreshCw className="w-4 h-4 mr-2" />Load Notion Databases</>}
                    </Button>
                    {databases.length > 0 && (
                        <select
                            value={selectedDb}
                            onChange={e => setSelectedDb(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {databases.map(db => (
                                <option key={db.id} value={db.id}>{db.title}</option>
                            ))}
                        </select>
                    )}
                </div>
                {dbError && <p className="mt-3 text-red-400 text-sm">{dbError}</p>}
                {databases.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                        Make sure your Notion database has properties: <code className="text-gray-400">Name, Status (select), URL, Description, NodeID, LastSynced</code>
                    </p>
                )}
            </div>

            {/* Nodes List */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-300">Project Nodes ({nodes.length})</h2>
                    {nodes.length > 0 && selectedDb && (
                        <Button onClick={syncAll} size="sm" className="bg-gray-700 hover:bg-gray-600 text-white text-xs">
                            <RefreshCw className="w-3 h-3 mr-1.5" />Sync All
                        </Button>
                    )}
                </div>
                {nodes.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-sm">No nodes found.</div>
                ) : (
                    <div className="divide-y divide-gray-700/50">
                        {nodes.map(node => {
                            const result = results[node.id];
                            const isSyncing = syncingNodeId === node.id;
                            return (
                                <div key={node.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{node.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{node.url}</p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[node.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                                        {node.status}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {result && !result.error && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {result.action === 'updated' ? 'Updated' : 'Created'}
                                            </span>
                                        )}
                                        {result?.error && (
                                            <span className="flex items-center gap-1 text-xs text-red-400">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Error
                                            </span>
                                        )}
                                        <Button
                                            onClick={() => syncNode(node.id)}
                                            disabled={isSyncing || !selectedDb}
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                                        >
                                            {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                                            Sync
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}