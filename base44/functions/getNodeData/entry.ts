import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Permission matrix per role
function buildPermissions(role, isAppAdmin) {
    if (isAppAdmin || role === 'owner') {
        return { canView: true, canEditNode: true, canEditDocs: true, canDelete: true, canManageMembers: true, canChat: true };
    }
    if (role === 'member') {
        return { canView: true, canEditNode: false, canEditDocs: true, canDelete: false, canManageMembers: false, canChat: true };
    }
    if (role === 'client') {
        return { canView: true, canEditNode: false, canEditDocs: false, canDelete: false, canManageMembers: false, canChat: true };
    }
    if (role === 'viewer') {
        return { canView: true, canEditNode: false, canEditDocs: false, canDelete: false, canManageMembers: false, canChat: false };
    }
    return { canView: false, canEditNode: false, canEditDocs: false, canDelete: false, canManageMembers: false, canChat: false };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId } = await req.json();
        const isAppAdmin = user.role === 'admin';

        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const myMembership = memberships[0];

        if (!myMembership && !isAppAdmin) {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        const myRole = isAppAdmin ? 'owner' : myMembership.role;
        const permissions = buildPermissions(myRole, isAppAdmin);

        const [node, messages, docs] = await Promise.all([
            base44.asServiceRole.entities.Node.get(nodeId),
            base44.asServiceRole.entities.NodeMessage.filter({ nodeId }, '-created_date'),
            base44.asServiceRole.entities.NodeDoc.filter({ nodeId }),
        ]);

        let inviteCodes = [];
        let members = [];
        if (permissions.canManageMembers) {
            [inviteCodes, members] = await Promise.all([
                base44.asServiceRole.entities.NodeInvite.filter({ nodeId }),
                base44.asServiceRole.entities.NodeMember.filter({ nodeId }),
            ]);
        }

        return Response.json({ node, messages, docs, permissions, myRole, inviteCodes, members });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});