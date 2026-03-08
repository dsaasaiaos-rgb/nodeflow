import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/Sidebar';
import CreateNodeModal from '@/components/modals/CreateNodeModal';
import JoinNodeModal from '@/components/modals/JoinNodeModal';
import { Button } from "@/components/ui/button";
import { Plus, Key, ExternalLink, Home, Users, Clock, Loader2, Search, Filter, ArrowUpDown, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import NodeContent from '@/components/NodeContent';
import NodeListItem from '@/components/hub/NodeListItem';

const PAGE_SIZE = 8;

export default function HubPage() {
    const [user, setUser] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [checkedIds, setCheckedIds] = useState(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            if (!currentUser) {
                base44.auth.redirectToLogin();
                return;
            }
            setUser(currentUser);

            const { data: { nodes: userNodes } } = await base44.functions.invoke("listMyNodes");
            setNodes(userNodes);
        } catch (e) {
            console.error(e);
            base44.auth.redirectToLogin();
        } finally {
            setIsLoading(false);
        }
    };

    const handleNodeClick = (node) => {
        setSelectedNodeId(node.id);
    };

    const handleNodeUpdate = (updatedNode) => {
        setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    };

    const handleCheck = (id, checked) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (!checkedIds.size) return;
        if (!confirm(`Delete ${checkedIds.size} node(s)? This cannot be undone.`)) return;
        setBulkDeleting(true);
        for (const id of checkedIds) {
            await base44.functions.invoke('deleteNode', { nodeId: id });
        }
        setBulkDeleting(false);
        setCheckedIds(new Set());
        loadData();
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    const filteredNodes = nodes.filter(node => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              node.url?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || node.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_date) - new Date(a.created_date);
        if (sortOrder === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
        if (sortOrder === 'a-z') return a.name.localeCompare(b.name);
        if (sortOrder === 'z-a') return b.name.localeCompare(a.name);
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(filteredNodes.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedNodes = filteredNodes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const allPageChecked = pagedNodes.length > 0 && pagedNodes.every(n => checkedIds.has(n.id));

    const handleSelectAll = (checked) => {
        if (checked) setCheckedIds(new Set(pagedNodes.map(n => n.id)));
        else setCheckedIds(new Set());
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
            <Sidebar 
                user={user}
                nodes={nodes}
                currentView="hub"
                currentNode={selectedNode}
                onSelectHub={() => setSelectedNodeId(null)}
                onSelectNode={handleNodeClick}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-10 mt-8 lg:mt-0">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            {user?.role === 'admin' ? 'Master Hub' : 'My Dashboard'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Overview of all active projects and services</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                    <ExternalLink className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Total Nodes</h3>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{nodes.length}</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Active</h3>
                            </div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{nodes.filter(n => n.status === 'Active').length}</p>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => setShowCreate(true)}
                            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                        >
                            <Plus className="w-10 h-10 mb-3 group-hover:rotate-90 transition-transform" />
                            <h3 className="font-bold text-xl mb-1">Create Node</h3>
                            <p className="text-indigo-100 text-sm">Start a new workspace</p>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            onClick={() => setShowJoin(true)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                        >
                            <Key className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                            <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1">Join Node</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Enter an invite code</p>
                        </motion.button>
                    </div>

                    {/* Nodes List */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nodes</h2>
                                {checkedIds.size > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={bulkDeleting}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        Delete {checkedIds.size}
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search nodes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-64"
                                    />
                                    {searchTerm && (
                                        <button 
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Active">Active</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="On Hold">On Hold</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="a-z">Name (A-Z)</option>
                                            <option value="z-a">Name (Z-A)</option>
                                        </select>
                                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Select-all bar */}
                        {pagedNodes.length > 0 && (
                            <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={allPageChecked}
                                    onChange={e => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {checkedIds.size > 0 ? `${checkedIds.size} selected` : `Select all on page`}
                                </span>
                            </div>
                        )}
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredNodes.length === 0 ? (
                                <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                                    <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <Home className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-xl font-semibold mb-2">
                                        {nodes.length === 0 ? "No nodes yet" : "No nodes match your search"}
                                    </p>
                                    {nodes.length === 0 && <p className="text-sm">Create or join a node to get started!</p>}
                                </div>
                            ) : (
                                pagedNodes.map((node, index) => (
                                    <NodeListItem
                                        key={node.id}
                                        node={node}
                                        index={index}
                                        selected={checkedIds.has(node.id)}
                                        onSelect={handleNodeClick}
                                        onCheck={handleCheck}
                                    />
                                ))
                            )}
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Page {safePage} of {totalPages} · {filteredNodes.length} nodes
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                                                p === safePage
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Node Content Modal */}
            <AnimatePresence>
                {selectedNodeId && selectedNode && (
                    <div className="fixed inset-0 z-50">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setSelectedNodeId(null)}
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute inset-x-0 bottom-0 h-[92vh] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden md:inset-y-10 md:inset-x-10 md:h-auto md:rounded-3xl border border-gray-200 dark:border-gray-800"
                        >
                            <NodeContent 
                                user={user}
                                node={selectedNode}
                                onClose={() => setSelectedNodeId(null)}
                                onUpdate={handleNodeUpdate}
                                onDelete={() => {
                                    setSelectedNodeId(null);
                                    loadData();
                                }}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showCreate && <CreateNodeModal onClose={() => setShowCreate(false)} onCreated={loadData} />}
            {showJoin && <JoinNodeModal onClose={() => setShowJoin(false)} onJoined={loadData} />}
        </div>
    );
}