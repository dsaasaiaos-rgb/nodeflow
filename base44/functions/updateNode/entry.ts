import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        console.log('UpdateNode called by user:', user?.id, user?.email, user?.role);

        if (!user) {
            console.log('Unauthorized: No user found');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId, updates } = await req.json();
        console.log('Updating node:', nodeId);
        console.log('Updates payload:', JSON.stringify(updates));

        // Verify user has permission (owner or admin)
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        console.log('Memberships found:', memberships.length);
        
        const isOwner = memberships.some(m => m.role === 'owner');
        console.log('Is Owner:', isOwner);
        
        if (!isOwner && user.role !== 'admin') {
            console.log('Access denied: Not owner or admin');
            return Response.json({ error: 'Only owners can update nodes' }, { status: 403 });
        }

        // Only allow updating specific fields
        // Ensure we don't pass undefined values which might cause issues
        const allowedUpdates = {};
        if (updates.name !== undefined) allowedUpdates.name = updates.name;
        if (updates.description !== undefined) allowedUpdates.description = updates.description;
        if (updates.url !== undefined) allowedUpdates.url = updates.url;
        if (updates.status !== undefined) allowedUpdates.status = updates.status;

        console.log('Applying updates:', JSON.stringify(allowedUpdates));

        const node = await base44.asServiceRole.entities.Node.update(nodeId, allowedUpdates);
        console.log('Node updated successfully:', node?.id);

        return Response.json({ node });
    } catch (error) {
        console.error('Error updating node:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});