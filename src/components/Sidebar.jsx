import React from 'react';
import { Home, LogOut, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function Sidebar({ user, nodes, currentNode, currentView, onSelectNode, onSelectHub, sidebarOpen, setSidebarOpen }) {
    
    const handleLogout = async () => {
        await base44.auth.logout();
    };

    return (
        <>
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2.5 rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <motion.div 
                initial={false}
                animate={{ x: sidebarOpen ? 0 : -320 }}
                className="fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0"
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-gray-900 leading-tight text-lg">Node Dashboard</h2>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <button
                            onClick={() => {
                                onSelectHub();
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-all ${
                                currentView === 'hub' 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Home className="w-5 h-5" />
                            <span className="font-semibold">{user?.role === 'admin' ? 'Master Hub' : 'My Nodes'}</span>
                        </button>

                        <div className="mb-3 mt-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Active Projects</h3>
                        </div>
                        <div className="space-y-1.5">
                            {nodes.length === 0 && (
                                <p className="text-sm text-gray-400 px-4 py-3 italic">No nodes yet</p>
                            )}
                            {nodes.map((node) => (
                                <button
                                    key={node.id}
                                    onClick={() => {
                                        onSelectNode(node);
                                        if (window.innerWidth < 1024) setSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                                        currentNode?.id === node.id 
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${
                                        node.status === 'Active' ? 'bg-green-500 animate-pulse' : 
                                        node.status === 'Completed' ? 'bg-blue-500' : 
                                        node.status === 'On Hold' ? 'bg-yellow-500' : 'bg-gray-400'
                                    }`} />
                                    <span className="text-sm truncate font-medium flex-1">{node.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-semibold">Sign Out</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
}