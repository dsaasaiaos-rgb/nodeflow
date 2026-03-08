import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink } from 'lucide-react';

const STATUS_STYLES = {
    'Active':      { dot: 'bg-green-500 animate-pulse', badge: 'bg-green-100 text-green-700 border-green-200' },
    'In Progress': { dot: 'bg-indigo-500',              badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'On Hold':     { dot: 'bg-yellow-500',              badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    'Completed':   { dot: 'bg-blue-500',                badge: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function NodeListItem({ node, index, selected, onSelect, onCheck }) {
    const styles = STATUS_STYLES[node.status] || { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700 border-gray-200' };

    return (
        <motion.div
            key={node.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(0.05 * index, 0.3) }}
            onClick={() => onSelect(node)}
            className="p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all group"
        >
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); onCheck(node.id, e.target.checked); }}
                    className="mt-1.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{node.name}</h3>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`} title={node.status} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 text-sm">{node.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(node.created_date).toLocaleDateString()}
                        </span>
                        <a
                            href={node.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 font-medium"
                            onClick={e => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Visit Site
                        </a>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${styles.badge}`}>
                    {node.status}
                </span>
            </div>
        </motion.div>
    );
}