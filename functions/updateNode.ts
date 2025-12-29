import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId, updates } = await req.json();

        // Verify user has permission (owner or admin)
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const isOwner = memberships.some(m => m.role === 'owner');
        
        if (!isOwner && user.role !== 'admin') {
            return Response.json({ error: 'Only owners can update nodes' }, { status: 403 });
        }

        // Only allow updating specific fields
        const allowedUpdates = {
            name: updates.name,
            description: updates.description,
            url: updates.url,
            status: updates.status
        };

        const node = await base44.asServiceRole.entities.Node.update(nodeId, allowedUpdates);

        return Response.json({ node });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});