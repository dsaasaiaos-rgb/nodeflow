import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { action, databaseId, nodeId } = await req.json();
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('notion');

        const notionHeaders = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        };

        // List databases
        if (action === 'listDatabases') {
            const res = await fetch('https://api.notion.com/v1/search', {
                method: 'POST',
                headers: notionHeaders,
                body: JSON.stringify({ filter: { value: 'database', property: 'object' } }),
            });
            const data = await res.json();
            const databases = (data.results || []).map(db => ({
                id: db.id,
                title: db.title?.[0]?.plain_text || 'Untitled',
            }));
            return Response.json({ databases });
        }

        // Sync a node's status to Notion
        if (action === 'syncNode') {
            if (!databaseId || !nodeId) {
                return Response.json({ error: 'databaseId and nodeId required' }, { status: 400 });
            }

            const node = await base44.asServiceRole.entities.Node.get(nodeId);
            if (!node) return Response.json({ error: 'Node not found' }, { status: 404 });

            // Search for existing page with matching node ID
            const searchRes = await fetch('https://api.notion.com/v1/databases/' + databaseId + '/query', {
                method: 'POST',
                headers: notionHeaders,
                body: JSON.stringify({
                    filter: { property: 'NodeID', rich_text: { equals: nodeId } },
                }),
            });
            const searchData = await searchRes.json();
            const existing = searchData.results?.[0];

            const properties = {
                Name: { title: [{ text: { content: node.name } }] },
                Status: { select: { name: node.status || 'Active' } },
                URL: { url: node.url || null },
                Description: { rich_text: [{ text: { content: node.description || '' } }] },
                NodeID: { rich_text: [{ text: { content: nodeId } }] },
                LastSynced: { date: { start: new Date().toISOString() } },
            };

            let pageRes;
            if (existing) {
                pageRes = await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
                    method: 'PATCH',
                    headers: notionHeaders,
                    body: JSON.stringify({ properties }),
                });
            } else {
                pageRes = await fetch('https://api.notion.com/v1/pages', {
                    method: 'POST',
                    headers: notionHeaders,
                    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
                });
            }

            const pageData = await pageRes.json();
            if (!pageRes.ok) {
                return Response.json({ error: pageData.message || 'Notion error' }, { status: 500 });
            }

            return Response.json({ success: true, pageId: pageData.id, action: existing ? 'updated' : 'created' });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});