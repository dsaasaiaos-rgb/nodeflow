import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId, key, content } = await req.json();

        // Verify access
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        
        if (memberships.length === 0 && user.role !== 'admin') {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        // Find existing doc
        const existingDocs = await base44.asServiceRole.entities.NodeDoc.filter({ nodeId, key });
        
        // Save version history before updating
        if (existingDocs.length > 0 && existingDocs[0].content) {
            await base44.asServiceRole.entities.DocVersion.create({
                nodeId,
                key,
                content: existingDocs[0].content,
                savedBy: existingDocs[0].updatedBy || user.id,
                savedByName: user.full_name || user.email.split('@')[0]
            });
        }

        let doc;
        if (existingDocs.length > 0) {
            doc = await base44.asServiceRole.entities.NodeDoc.update(existingDocs[0].id, {
                content,
                updatedBy: user.id
            });
        } else {
            doc = await base44.asServiceRole.entities.NodeDoc.create({
                nodeId,
                key,
                content,
                updatedBy: user.id
            });
        }

        return Response.json({ doc });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});