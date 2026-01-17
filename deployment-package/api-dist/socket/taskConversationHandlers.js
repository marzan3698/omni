import { taskConversationService } from '../services/taskConversation.service.js';
import { prisma } from '../lib/prisma.js';
// Store online users per task room
const onlineUsers = new Map(); // taskId -> Set of userIds
/**
 * Verify user has access to task
 */
async function verifyTaskAccess(taskId, companyId, userId, employeeId) {
    try {
        // Get user's role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true, employee: true },
        });
        if (!user)
            return false;
        // SuperAdmin has access to everything
        if (user.role.name === 'SuperAdmin') {
            return true;
        }
        // Check permissions
        const permissions = user.role.permissions;
        if (permissions['can_view_tasks']) {
            return true;
        }
        // Get task
        const task = await prisma.task.findFirst({
            where: { id: taskId, companyId },
            include: { assignedEmployee: true },
        });
        if (!task)
            return false;
        // Check if user has employee record
        if (!user.employee)
            return false;
        // Check if task is assigned to this employee individually
        if (task.assignedTo === user.employee.id) {
            return true;
        }
        // Check if user is part of a group assigned to this task
        if (task.groupId) {
            const isGroupMember = await prisma.employeeGroupMember.findFirst({
                where: {
                    groupId: task.groupId,
                    employeeId: user.employee.id,
                },
            });
            if (isGroupMember) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error('Error verifying task access:', error);
        return false;
    }
}
/**
 * Setup task conversation Socket.IO event handlers
 */
export function setupTaskConversationHandlers(io, socket) {
    const userId = socket.userId;
    const companyId = socket.companyId;
    const userEmail = socket.userEmail;
    if (!userId || !companyId) {
        socket.disconnect();
        return;
    }
    /**
     * Join task conversation room
     */
    socket.on('join-task-room', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId } = data;
            // Verify company matches
            if (taskCompanyId !== companyId) {
                socket.emit('error', { message: 'Company ID mismatch' });
                return;
            }
            // Verify user has access to task
            const hasAccess = await verifyTaskAccess(taskId, companyId, userId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied to this task' });
                return;
            }
            const roomName = `task-${taskId}`;
            await socket.join(roomName);
            // Track online user
            if (!onlineUsers.has(taskId)) {
                onlineUsers.set(taskId, new Set());
            }
            onlineUsers.get(taskId).add(userId);
            // Notify others in room that user came online
            socket.to(roomName).emit('user-online', {
                userId,
                userEmail,
                taskId,
            });
            // Send confirmation
            socket.emit('joined-task-room', { taskId, roomName });
            console.log(`User ${userId} joined task room: ${roomName}`);
        }
        catch (error) {
            console.error('Error joining task room:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to join room',
            });
        }
    });
    /**
     * Leave task conversation room
     */
    socket.on('leave-task-room', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId } = data;
            if (taskCompanyId !== companyId) {
                return;
            }
            const roomName = `task-${taskId}`;
            await socket.leave(roomName);
            // Remove from online users
            if (onlineUsers.has(taskId)) {
                onlineUsers.get(taskId).delete(userId);
                if (onlineUsers.get(taskId).size === 0) {
                    onlineUsers.delete(taskId);
                }
            }
            // Notify others in room that user went offline
            socket.to(roomName).emit('user-offline', {
                userId,
                userEmail,
                taskId,
            });
            console.log(`User ${userId} left task room: ${roomName}`);
        }
        catch (error) {
            console.error('Error leaving task room:', error);
        }
    });
    /**
     * Send message in task conversation
     */
    socket.on('send-message', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId, content, messageType, attachmentId } = data;
            // Verify company matches
            if (taskCompanyId !== companyId) {
                socket.emit('error', { message: 'Company ID mismatch' });
                return;
            }
            // Verify user has access to task
            const hasAccess = await verifyTaskAccess(taskId, companyId, userId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied to this task' });
                return;
            }
            // Get or create conversation
            let conversation = await taskConversationService.getConversationByTaskId(taskId, companyId);
            if (!conversation) {
                conversation = await taskConversationService.createConversation({
                    taskId,
                    companyId,
                });
            }
            if (!conversation) {
                socket.emit('error', { message: 'Failed to get or create conversation' });
                return;
            }
            // Send message via service
            const message = await taskConversationService.sendMessage({
                conversationId: conversation.id,
                senderId: userId,
                content,
                messageType: messageType || 'text',
                attachmentId,
            });
            // Get full message with sender info and attachment
            const fullMessage = await prisma.taskMessage.findUnique({
                where: { id: message.id },
                include: {
                    sender: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                    attachment: {
                        include: {
                            creator: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                },
            });
            // Serialize BigInt and Decimal values for JSON
            const serializedMessage = fullMessage ? {
                ...fullMessage,
                attachment: fullMessage.attachment ? {
                    ...fullMessage.attachment,
                    fileSize: fullMessage.attachment.fileSize ? Number(fullMessage.attachment.fileSize) : null,
                    // Ensure all attachment fields are properly included
                    id: fullMessage.attachment.id,
                    taskId: fullMessage.attachment.taskId,
                    subTaskId: fullMessage.attachment.subTaskId,
                    companyId: fullMessage.attachment.companyId,
                    fileType: fullMessage.attachment.fileType,
                    fileUrl: fullMessage.attachment.fileUrl,
                    fileName: fullMessage.attachment.fileName,
                    mimeType: fullMessage.attachment.mimeType,
                    linkUrl: fullMessage.attachment.linkUrl,
                    linkTitle: fullMessage.attachment.linkTitle,
                    linkDescription: fullMessage.attachment.linkDescription,
                    thumbnailUrl: fullMessage.attachment.thumbnailUrl,
                    duration: fullMessage.attachment.duration,
                    createdBy: fullMessage.attachment.createdBy,
                    createdAt: fullMessage.attachment.createdAt,
                    updatedAt: fullMessage.attachment.updatedAt,
                    creator: fullMessage.attachment.creator,
                } : null,
            } : null;
            const roomName = `task-${taskId}`;
            // Broadcast new message to all users in room
            io.to(roomName).emit('new-message', {
                message: serializedMessage,
                taskId,
            });
            // Send confirmation to sender
            socket.emit('message-sent', {
                messageId: message.id,
                taskId,
            });
            console.log(`Message sent in task ${taskId} by user ${userId}`);
        }
        catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to send message',
            });
        }
    });
    /**
     * User started typing
     */
    socket.on('typing-start', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId } = data;
            if (taskCompanyId !== companyId) {
                return;
            }
            const roomName = `task-${taskId}`;
            // Broadcast typing indicator to others in room
            socket.to(roomName).emit('user-typing', {
                userId,
                userEmail,
                taskId,
            });
        }
        catch (error) {
            console.error('Error handling typing start:', error);
        }
    });
    /**
     * User stopped typing
     */
    socket.on('typing-stop', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId } = data;
            if (taskCompanyId !== companyId) {
                return;
            }
            const roomName = `task-${taskId}`;
            // Broadcast stop typing to others in room
            socket.to(roomName).emit('user-stopped-typing', {
                userId,
                userEmail,
                taskId,
            });
        }
        catch (error) {
            console.error('Error handling typing stop:', error);
        }
    });
    /**
     * Mark user as online
     */
    socket.on('mark-online', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId } = data;
            if (taskCompanyId !== companyId) {
                return;
            }
            const roomName = `task-${taskId}`;
            // Track online user
            if (!onlineUsers.has(taskId)) {
                onlineUsers.set(taskId, new Set());
            }
            onlineUsers.get(taskId).add(userId);
            // Broadcast online status to others in room
            socket.to(roomName).emit('user-online', {
                userId,
                userEmail,
                taskId,
            });
        }
        catch (error) {
            console.error('Error marking user online:', error);
        }
    });
    /**
     * Mark user as offline
     */
    socket.on('mark-offline', async (data) => {
        try {
            const { taskId, companyId: taskCompanyId } = data;
            if (taskCompanyId !== companyId) {
                return;
            }
            const roomName = `task-${taskId}`;
            // Remove from online users
            if (onlineUsers.has(taskId)) {
                onlineUsers.get(taskId).delete(userId);
                if (onlineUsers.get(taskId).size === 0) {
                    onlineUsers.delete(taskId);
                }
            }
            // Broadcast offline status to others in room
            socket.to(roomName).emit('user-offline', {
                userId,
                userEmail,
                taskId,
            });
        }
        catch (error) {
            console.error('Error marking user offline:', error);
        }
    });
    /**
     * Handle disconnection - clean up online users
     */
    socket.on('disconnect', () => {
        // Remove user from all task rooms they were in
        onlineUsers.forEach((userSet, taskId) => {
            if (userSet.has(userId)) {
                userSet.delete(userId);
                if (userSet.size === 0) {
                    onlineUsers.delete(taskId);
                }
                else {
                    // Notify others in room
                    const roomName = `task-${taskId}`;
                    socket.to(roomName).emit('user-offline', {
                        userId,
                        userEmail,
                        taskId,
                    });
                }
            }
        });
    });
}
//# sourceMappingURL=taskConversationHandlers.js.map