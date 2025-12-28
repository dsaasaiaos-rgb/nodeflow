import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId } = await req.json();

        // Verify user has access to this node
        const memberships = await base44.entities.NodeMember.filter({ nodeId, userId: user.id });
        
        if (memberships.length === 0 && user.role !== 'admin') {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch messages and docs
        const messages = await base44.entities.NodeMessage.filter({ nodeId }, '-created_date');
        const docs = await base44.entities.NodeDoc.filter({ nodeId });

        return Response.json({ messages, docs });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});