import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { nodeId, updates } = await req.json();

        const isAppAdmin = user.role === 'admin';
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const myRole = memberships[0]?.role;
        const canEdit = isAppAdmin || myRole === 'owner';

        if (!canEdit) {
            return Response.json({ error: 'Only owners can update node settings' }, { status: 403 });
        }

        const allowedUpdates = {};
        if (updates.name !== undefined) allowedUpdates.name = updates.name;
        if (updates.description !== undefined) allowedUpdates.description = updates.description;
        if (updates.url !== undefined) allowedUpdates.url = updates.url;
        if (updates.status !== undefined) allowedUpdates.status = updates.status;

        const node = await base44.asServiceRole.entities.Node.update(nodeId, allowedUpdates);
        return Response.json({ node });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});