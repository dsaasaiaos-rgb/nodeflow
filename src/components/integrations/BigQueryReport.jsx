import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart2, TrendingUp, DollarSign, MousePointer, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BigQueryReport() {
    const [config, setConfig] = useState({ projectId: '', datasetId: '', tableId: '', dateRange: '30' });
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    const handleRun = async () => {
        setLoading(true);
        setError('');
        setReport(null);
        const { data } = await base44.functions.invoke('bigqueryReport', {
            ...config,
            dateRange: parseInt(config.dateRange),
        });
        setLoading(false);
        if (data.error) { setError(data.error); return; }
        setReport(data);
    };

    const fmt = (n) => n == null ? '—' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;

    const summaryStats = report ? [
        { label: 'Campaigns', value: report.totalRows, icon: BarChart2, color: 'indigo' },
        { label: 'Total Impressions', value: fmt(report.rows.reduce((a, r) => a + (r.total_impressions || 0), 0)), icon: Eye, color: 'blue' },
        { label: 'Total Clicks', value: fmt(report.rows.reduce((a, r) => a + (r.total_clicks || 0), 0)), icon: MousePointer, color: 'purple' },
        { label: 'Total Spend', value: '$' + fmt(report.rows.reduce((a, r) => a + (r.total_spend || 0), 0)), icon: DollarSign, color: 'emerald' },
    ] : [];

    const colorMap = { indigo: 'bg-indigo-500/20 text-indigo-400', blue: 'bg-blue-500/20 text-blue-400', purple: 'bg-purple-500/20 text-purple-400', emerald: 'bg-emerald-500/20 text-emerald-400' };

    return (
        <div className="space-y-6">
            {/* Config Panel */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-400" />
                    BigQuery Marketing Campaign Report
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {[
                        { key: 'projectId', label: 'Project ID', placeholder: 'my-gcp-project' },
                        { key: 'datasetId', label: 'Dataset ID', placeholder: 'marketing_data' },
                        { key: 'tableId', label: 'Table ID', placeholder: 'campaigns' },
                        { key: 'dateRange', label: 'Days Back', placeholder: '30' },
                    ].map(f => (
                        <div key={f.key}>
                            <Label className="text-gray-300 text-xs mb-1 block">{f.label}</Label>
                            <input
                                value={config[f.key]}
                                onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    ))}
                </div>
                <Button onClick={handleRun} disabled={loading || !config.projectId || !config.datasetId || !config.tableId} className="bg-indigo-600 hover:bg-indigo-700">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running Query...</> : <><BarChart2 className="w-4 h-4 mr-2" />Generate Report</>}
                </Button>
                {error && <p className="mt-3 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{error}</p>}
                <p className="mt-3 text-xs text-gray-500">
                    Note: Your BigQuery table should have columns: <code className="text-gray-400">campaign_name, impressions, clicks, conversions, spend, date</code>
                </p>
            </div>

            {/* Results */}
            {report && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryStats.map(s => (
                            <div key={s.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorMap[s.color]}`}>
                                    <s.icon className="w-4 h-4" />
                                </div>
                                <p className="text-2xl font-bold text-white">{s.value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-gray-300 mb-4">Spend by Campaign</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={report.rows.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="campaign_name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
                                <Bar dataKey="total_spend" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spend" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-sm font-bold text-gray-300">Campaign Details ({report.totalRows} campaigns)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-900/50">
                                        {['Campaign', 'Impressions', 'Clicks', 'CTR', 'Conversions', 'Conv. Rate', 'Spend', 'CPC'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {report.rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{row.campaign_name}</td>
                                            <td className="px-4 py-3 text-gray-300">{fmt(row.total_impressions)}</td>
                                            <td className="px-4 py-3 text-gray-300">{fmt(row.total_clicks)}</td>
                                            <td className="px-4 py-3 text-indigo-400">{row.ctr != null ? row.ctr.toFixed(2) + '%' : '—'}</td>
                                            <td className="px-4 py-3 text-gray-300">{fmt(row.total_conversions)}</td>
                                            <td className="px-4 py-3 text-emerald-400">{row.conversion_rate != null ? row.conversion_rate.toFixed(2) + '%' : '—'}</td>
                                            <td className="px-4 py-3 text-yellow-400">${fmt(row.total_spend)}</td>
                                            <td className="px-4 py-3 text-gray-300">${fmt(row.cost_per_conversion)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}