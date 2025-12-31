import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId } = await req.json();

        if (!nodeId) {
            return Response.json({ error: 'Node ID required' }, { status: 400 });
        }

        // Check permissions
        const node = await base44.asServiceRole.entities.Node.get(nodeId);
        if (!node) {
            return Response.json({ error: 'Node not found' }, { status: 404 });
        }

        if (node.ownerUserId !== user.id && user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Only owner or admin can delete a node' }, { status: 403 });
        }

        // Clean up memberships
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId });
        await Promise.all(memberships.map(m => base44.asServiceRole.entities.NodeMember.delete(m.id)));

        // Delete the node
        await base44.asServiceRole.entities.Node.delete(nodeId);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error deleting node:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});