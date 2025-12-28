import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/Sidebar';
import CreateNodeModal from '@/components/modals/CreateNodeModal';
import JoinNodeModal from '@/components/modals/JoinNodeModal';
import { Button } from "@/components/ui/button";
import { Plus, Key, ExternalLink, Home, Users, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function HubPage() {
    const [user, setUser] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

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
        window.location.href = createPageUrl('NodeView') + '?nodeId=' + node.id;
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
                currentNode={null}
                onSelectHub={() => {}}
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
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Nodes</h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {nodes.length === 0 ? (
                                <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                                    <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <Home className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-xl font-semibold mb-2">No nodes yet</p>
                                    <p className="text-sm">Create or join a node to get started!</p>
                                </div>
                            ) : (
                                nodes.map((node, index) => (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        onClick={() => handleNodeClick(node)}
                                        className="p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{node.name}</h3>
                                                    {node.status === 'Active' && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                                    )}
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{node.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(node.created_date).toLocaleDateString()}
                                                    </span>
                                                    <a
                                                        href={node.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 hover:underline font-medium"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Visit Site
                                                    </a>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                                node.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                                node.status === 'Completed' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                                                node.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                'bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}>
                                                {node.status}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {showCreate && <CreateNodeModal onClose={() => setShowCreate(false)} onCreated={loadData} />}
            {showJoin && <JoinNodeModal onClose={() => setShowJoin(false)} onJoined={loadData} />}
        </div>
    );
}