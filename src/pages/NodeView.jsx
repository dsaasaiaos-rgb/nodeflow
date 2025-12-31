import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/Sidebar';
import { Button } from "@/components/ui/button";
import { Loader2, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';
import NodeContent from '@/components/NodeContent';

export default function NodeViewPage() {
    const [user, setUser] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [node, setNode] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const nodeId = urlParams.get('nodeId');

            const currentUser = await base44.auth.me();
            if (!currentUser) {
                base44.auth.redirectToLogin();
                return;
            }
            setUser(currentUser);

            const { data: { nodes: userNodes } } = await base44.functions.invoke("listMyNodes");
            setNodes(userNodes);

            const currentNode = userNodes.find(n => n.id === nodeId);
            if (currentNode) {
                setNode(currentNode);
            }
        } catch (e) {
            console.error(e);
            base44.auth.redirectToLogin();
        } finally {
            setIsLoading(false);
        }
    };

    const handleNodeClick = (selectedNode) => {
        window.location.href = createPageUrl('NodeView') + '?nodeId=' + selectedNode.id;
    };

    const handleHubClick = () => {
        window.location.href = createPageUrl('Hub');
    };

    const handleNodeUpdate = (updatedNode) => {
        setNode(updatedNode);
        // Also update in the nodes list if needed
        setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!node) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Home className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Node not found</h2>
                    <Button onClick={handleHubClick}>Go to Hub</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
            <Sidebar 
                user={user}
                nodes={nodes}
                currentView="node"
                currentNode={node}
                onSelectHub={handleHubClick}
                onSelectNode={handleNodeClick}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            
            <div className="flex-1 overflow-hidden">
                <NodeContent 
                    user={user} 
                    node={node} 
                    onUpdate={handleNodeUpdate}
                    onDelete={() => {
                        window.location.href = createPageUrl('Hub');
                    }}
                />
            </div>
        </div>
    );
}