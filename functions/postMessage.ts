import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId, content } = await req.json();

        // Verify access
        const memberships = await base44.entities.NodeMember.filter({ nodeId, userId: user.id });
        
        if (memberships.length === 0 && user.role !== 'admin') {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        const message = await base44.entities.NodeMessage.create({
            nodeId,
            userId: user.id,
            userName: user.full_name || user.email.split('@')[0],
            body: content
        });

        return Response.json({ message });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});