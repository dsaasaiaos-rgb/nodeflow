import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.log("Unauthorized: No user found");
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, url } = await req.json();
        console.log(`Creating node: ${name} for ${user.email}`);

        if (!name || !description || !url) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the node
        // Use asServiceRole to ensure we have permission, and RLS now allows admin/creator
        const node = await base44.asServiceRole.entities.Node.create({
            name,
            description,
            url,
            status: 'Active',
            ownerUserId: user.id
        });
        
        console.log(`Node created: ${node.id}`);

        // Create owner membership
        await base44.asServiceRole.entities.NodeMember.create({
            nodeId: node.id,
            userId: user.id,
            role: 'owner'
        });
        console.log(`NodeMember created for node ${node.id}`);

        return Response.json({ node });
    } catch (error) {
        console.error("Error creating node:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});