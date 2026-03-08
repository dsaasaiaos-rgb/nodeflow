import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { nodeId, key, content } = await req.json();

        const isAppAdmin = user.role === 'admin';
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const myRole = memberships[0]?.role;
        const canEditDocs = isAppAdmin || myRole === 'owner' || myRole === 'member';

        if (!canEditDocs) {
            return Response.json({ error: 'You do not have permission to edit documents' }, { status: 403 });
        }

        const existingDocs = await base44.asServiceRole.entities.NodeDoc.filter({ nodeId, key });

        if (existingDocs.length > 0 && existingDocs[0].content) {
            await base44.asServiceRole.entities.DocVersion.create({
                nodeId, key,
                content: existingDocs[0].content,
                savedBy: existingDocs[0].updatedBy || user.id,
                savedByName: user.full_name || user.email.split('@')[0]
            });
        }

        let doc;
        if (existingDocs.length > 0) {
            doc = await base44.asServiceRole.entities.NodeDoc.update(existingDocs[0].id, { content, updatedBy: user.id });
        } else {
            doc = await base44.asServiceRole.entities.NodeDoc.create({ nodeId, key, content, updatedBy: user.id });
        }

        return Response.json({ doc });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});