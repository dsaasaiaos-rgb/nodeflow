import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, ...params } = await req.json();

        // ---------------------------------------------------------
        // LIST CONVERSATIONS
        // ---------------------------------------------------------
        if (action === 'listConversations') {
            // 1. Find all participant records for this user
            const participations = await base44.asServiceRole.entities.ChatParticipant.filter({ 
                userId: user.id 
            });
            
            if (participations.length === 0) {
                return Response.json({ conversations: [] });
            }

            const conversationIds = participations.map(p => p.conversationId);
            
            // 2. Fetch the conversations
            // Doing this in a loop or Promise.all since we don't have 'in' query in simple filter usually
            // Assuming filter doesn't support $in for IDs based on docs, so fetching individually or logic
            // Actually, let's try to fetch all and filter in memory if list is small, 
            // OR simpler: fetch details for each.
            
            const conversations = [];
            for (const p of participations) {
                const conv = await base44.asServiceRole.entities.ChatConversation.get(p.conversationId);
                if (conv) {
                    conversations.push({
                        ...conv,
                        hasRead: p.hasRead
                    });
                }
            }
            
            // Sort by lastMessageAt descending
            conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

            return Response.json({ conversations });
        }

        // ---------------------------------------------------------
        // GET MESSAGES
        // ---------------------------------------------------------
        if (action === 'getMessages') {
            const { conversationId } = params;
            
            // Verify membership
            const member = await base44.asServiceRole.entities.ChatParticipant.filter({
                conversationId,
                userId: user.id
            });

            if (member.length === 0) {
                return Response.json({ error: 'Access denied' }, { status: 403 });
            }

            // Mark as read
            if (!member[0].hasRead) {
                await base44.asServiceRole.entities.ChatParticipant.update(member[0].id, { hasRead: true });
            }

            const messages = await base44.asServiceRole.entities.ChatMessage.filter(
                { conversationId }, 
                '-created_date', 
                50 // Limit 50
            );

            // Fetch participants to show names/details if needed? 
            // For now messages have senderName.

            return Response.json({ messages: messages.reverse() }); // Return chronologically
        }

        // ---------------------------------------------------------
        // SEND MESSAGE
        // ---------------------------------------------------------
        if (action === 'sendMessage') {
            const { conversationId, content } = params;

            // Verify membership
            const member = await base44.asServiceRole.entities.ChatParticipant.filter({
                conversationId,
                userId: user.id
            });

            if (member.length === 0) {
                return Response.json({ error: 'Access denied' }, { status: 403 });
            }

            // Create message
            const message = await base44.asServiceRole.entities.ChatMessage.create({
                conversationId,
                senderId: user.id,
                senderName: user.full_name || user.email,
                content
            });

            // Update conversation last message
            await base44.asServiceRole.entities.ChatConversation.update(conversationId, {
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            });

            // Mark all participants as unread except sender
            const allParticipants = await base44.asServiceRole.entities.ChatParticipant.filter({ conversationId });
            for (const p of allParticipants) {
                if (p.userId !== user.id) {
                    await base44.asServiceRole.entities.ChatParticipant.update(p.id, { hasRead: false });
                }
            }

            return Response.json({ message });
        }

        // ---------------------------------------------------------
        // CREATE CONVERSATION (Group or Direct)
        // ---------------------------------------------------------
        if (action === 'createConversation') {
            const { type, name, participantUserIds } = params; // participantUserIds array of strings

            if (!participantUserIds || participantUserIds.length === 0) {
                return Response.json({ error: 'Participants required' }, { status: 400 });
            }

            // Check if DM exists
            if (type === 'direct' && participantUserIds.length === 1) {
                const targetId = participantUserIds[0];
                // Logic to find existing DM... skipping for simplicity/MVP. 
                // Creating new one is safer to avoid bugs for now.
            }

            const conversation = await base44.asServiceRole.entities.ChatConversation.create({
                type,
                name: name || (type === 'direct' ? 'Direct Message' : 'New Group'),
                ownerId: user.id,
                lastMessageAt: new Date().toISOString()
            });

            // Add self
            await base44.asServiceRole.entities.ChatParticipant.create({
                conversationId: conversation.id,
                userId: user.id
            });

            // Add others
            for (const uid of participantUserIds) {
                await base44.asServiceRole.entities.ChatParticipant.create({
                    conversationId: conversation.id,
                    userId: uid
                });
            }

            return Response.json({ conversation });
        }

        // ---------------------------------------------------------
        // LIST AVAILABLE USERS (for creating chat)
        // ---------------------------------------------------------
        if (action === 'listUsers') {
            // Only allow if appropriate? 
            // For this app, listing all users seems acceptable for finding team members.
            // Using service role to bypass restriction.
            const users = await base44.asServiceRole.entities.User.list();
            
            // Return only safe fields
            const safeUsers = users.map(u => ({
                id: u.id,
                full_name: u.full_name,
                email: u.email
            }));

            return Response.json({ users: safeUsers });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Chat function error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});