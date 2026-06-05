import React, { useState, useEffect } from 'react';
import { Home, LogOut, Menu, X, Moon, Sun, MessageSquare, ChevronDown, User, Users, Info, Mail } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function Sidebar({ user, nodes, currentNode, currentView, onSelectNode, onSelectHub, sidebarOpen, setSidebarOpen, conversations = [], activeConversation, onSelectConversation }) {
    const [darkMode, setDarkMode] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(currentView === 'messages');

    useEffect(() => {
        const saved = localStorage.getItem('darkMode') === 'true';
        setDarkMode(saved);
        if (saved) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode.toString());
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    
    const handleLogout = async () => {
        await base44.auth.logout();
    };

    return (
        <>
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                {sidebarOpen ? <X className="w-5 h-5 dark:text-gray-300" /> : <Menu className="w-5 h-5 dark:text-gray-300" />}
            </button>

            <motion.div 
                initial={false}
                animate={{ x: sidebarOpen ? 0 : -320 }}
                className="fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-200 ease-in-out lg:translate-x-0"
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 pl-2">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-gray-900 dark:text-white leading-tight text-lg">Node Dashboard</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                                currentView === 'hub' 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <Home className="w-5 h-5" />
                            <span className="font-semibold">Overview</span>
                        </button>

                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    if (currentView !== 'messages') {
                                        window.location.href = createPageUrl('Messages');
                                    } else {
                                        setMessagesOpen(o => !o);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    currentView === 'messages'
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span className="font-semibold flex-1 text-left">Messages</span>
                                {currentView === 'messages' && (
                                    <ChevronDown className={`w-4 h-4 transition-transform ${messagesOpen ? 'rotate-180' : ''}`} />
                                )}
                            </button>

                            <AnimatePresence>
                                {currentView === 'messages' && messagesOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden mt-1 ml-2 space-y-0.5"
                                    >
                                        {conversations.length === 0 && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2 italic">No conversations yet</p>
                                        )}
                                        {conversations.map(conv => (
                                            <button
                                                key={conv.id}
                                                onClick={() => onSelectConversation?.(conv)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                                                    activeConversation?.id === conv.id
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <div className={`p-1 rounded-full flex-shrink-0 ${conv.type === 'group' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                                    {conv.type === 'group' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                </div>
                                                <span className="truncate font-medium flex-1">{conv.name || 'Chat'}</span>
                                                {!conv.hasRead && (
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mb-3 mt-6">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">Active Projects</h3>
                        </div>
                        <div className="space-y-1.5">
                            {nodes.length === 0 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3 italic">No nodes yet</p>
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
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                        <div className="flex gap-2 px-1 pb-1">
                            <Link to="/about" className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                                <Info className="w-3 h-3" /> About
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <Link to="/contact" className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Contact
                            </Link>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            <span className="font-semibold">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
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
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
}