import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart2, RefreshCw, CheckCircle, AlertCircle, Database, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import BigQueryReport from '@/components/integrations/BigQueryReport';
import NotionSync from '@/components/integrations/NotionSync';

export default function IntegrationsPage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('bigquery');

    useEffect(() => {
        base44.auth.me().then(u => {
            if (!u) base44.auth.redirectToLogin();
            else setUser(u);
        });
    }, []);

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );

    const tabs = [
        { id: 'bigquery', label: 'BigQuery Reports', icon: BarChart2 },
        { id: 'notion', label: 'Notion Sync', icon: Database },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Integrations</h1>
                    <p className="text-gray-400">Connect your tools and automate workflows</p>
                </motion.div>

                {/* Tab Nav */}
                <div className="flex gap-2 mb-8 border-b border-gray-800 pb-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'bigquery' && <BigQueryReport />}
                {activeTab === 'notion' && <NotionSync user={user} />}
            </div>
        </div>
    );
}