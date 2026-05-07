import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { nodeId, memberId, newRole } = await req.json();

        const allowedRoles = ['owner', 'member', 'viewer', 'client'];
        if (!allowedRoles.includes(newRole)) {
            return Response.json({ error: 'Invalid role' }, { status: 400 });
        }

        const isAppAdmin = user.role === 'admin';
        const myMemberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const canManage = isAppAdmin || myMemberships[0]?.role === 'owner';

        if (!canManage) {
            return Response.json({ error: 'Only owners can change member roles' }, { status: 403 });
        }

        const updated = await base44.asServiceRole.entities.NodeMember.update(memberId, { role: newRole });
        return Response.json({ member: updated });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});