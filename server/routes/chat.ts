import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getMongoDb } from '../mongo';

const router = Router();

// Configure Multer Storage for Chat Files & Media
const chatUploadsDir = path.join(process.cwd(), 'server', 'uploads', 'chat');
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB max file size for videos, audio, documents
  }
});

// POST /api/chat/upload (Upload any file: image, video, audio, pdf, docx, etc.)
router.post('/upload', authenticateToken, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  const mime = req.file.mimetype || 'application/octet-stream';
  let messageType = 'DOCUMENT';
  if (mime.startsWith('image/')) messageType = 'IMAGE';
  else if (mime.startsWith('video/')) messageType = 'VIDEO';
  else if (mime.startsWith('audio/')) messageType = 'AUDIO';

  const fileUrl = `/uploads/chat/${req.file.filename}`;

  res.status(201).json({
    message: 'File uploaded successfully',
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: mime,
    messageType
  });
});

// GET /api/chat/conversations (All team members + General Channel with last messages)
router.get('/conversations', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;

  // 1. General Team Channel info
  const generalLastMsg = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.recipient_id IS NULL
    ORDER BY m.created_at DESC
    LIMIT 1
  `).get() as any;

  const generalChannel = {
    id: 0,
    name: 'All Team Hub',
    description: 'Company-wide team chat, announcements & open screen share',
    role: 'GROUP',
    department_name: 'Fly Media Technology',
    isGeneral: true,
    last_message: generalLastMsg?.message_text || (generalLastMsg?.file_name ? `📎 [${generalLastMsg.message_type}] ${generalLastMsg.file_name}` : 'Welcome to the team chat!'),
    last_message_time: generalLastMsg?.created_at || new Date().toISOString(),
    unread_count: 0,
    is_online: true
  };

  // 2. Direct Conversations with all other team members
  const teamMembers = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.designation, d.name as department_name, u.is_active
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id != ? AND u.is_active = 1
    ORDER BY u.name ASC
  `).all(currentUserId) as any[];

  const conversations = teamMembers.map(member => {
    // Get latest message between current user and member
    const lastMsg = db.prepare(`
      SELECT *
      FROM chat_messages
      WHERE (sender_id = ? AND recipient_id = ?)
         OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at DESC
      LIMIT 1
    `).get(currentUserId, member.id, member.id, currentUserId) as any;

    // Count unread messages sent by member to current user
    const unread = db.prepare(`
      SELECT count(*) as count
      FROM chat_messages
      WHERE sender_id = ? AND recipient_id = ? AND is_read = 0
    `).get(member.id, currentUserId) as any;

    let snippet = 'No messages yet. Tap to start chatting.';
    if (lastMsg) {
      if (lastMsg.message_text) {
        snippet = lastMsg.message_text;
      } else if (lastMsg.file_name) {
        snippet = `📎 [${lastMsg.message_type}] ${lastMsg.file_name}`;
      }
    }

    return {
      ...member,
      last_message: snippet,
      last_message_time: lastMsg?.created_at || null,
      unread_count: unread?.count || 0,
      is_online: true // In local office environment, mark active team as available
    };
  });

  // Sort conversations by most recent message
  conversations.sort((a, b) => {
    if (!a.last_message_time) return 1;
    if (!b.last_message_time) return -1;
    return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
  });

  res.json({
    generalChannel,
    conversations
  });
});

// GET /api/chat/messages/:targetId (Fetch message history & mark read)
router.get('/messages/:targetId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetId = req.params.targetId;

  let messages: any[] = [];

  if (targetId === '0' || targetId === 'general') {
    // General company channel
    messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id IS NULL
      ORDER BY m.created_at ASC
    `).all();
  } else {
    const memberId = Number(targetId);
    messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.recipient_id = ?)
         OR (m.sender_id = ? AND m.recipient_id = ?)
      ORDER BY m.created_at ASC
    `).all(currentUserId, memberId, memberId, currentUserId);

    // Mark messages sent by the other party as read
    db.prepare(`
      UPDATE chat_messages
      SET is_read = 1
      WHERE sender_id = ? AND recipient_id = ? AND is_read = 0
    `).run(memberId, currentUserId);
  }

  res.json({ messages });
});

// POST /api/chat/messages (Send new message: text or media attachment)
router.post('/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    recipient_id,
    message_text = '',
    message_type = 'TEXT',
    file_url = null,
    file_name = null,
    file_size = null,
    file_mime = null
  } = req.body;

  if (!message_text && !file_url) {
    res.status(400).json({ error: 'Message text or attachment is required.' });
    return;
  }

  const targetRecipientId = (recipient_id && Number(recipient_id) > 0) ? Number(recipient_id) : null;

  // Insert to SQLite
  const insertStmt = db.prepare(`
    INSERT INTO chat_messages (
      sender_id, recipient_id, message_text, message_type,
      file_url, file_name, file_size, file_mime, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `);

  const info = insertStmt.run(
    user.id,
    targetRecipientId,
    message_text.trim(),
    message_type,
    file_url,
    file_name,
    file_size,
    file_mime
  );

  const newMsg = db.prepare(`
    SELECT m.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(info.lastInsertRowid) as any;

  // Dual Persistence: Sync to MongoDB collection 'chat_messages'
  try {
    const mongoDb = getMongoDb();
    await mongoDb.collection('chat_messages').insertOne({
      sqlite_id: info.lastInsertRowid,
      sender_id: user.id,
      sender_name: user.name,
      recipient_id: targetRecipientId,
      message_text: message_text.trim(),
      message_type,
      file_url,
      file_name,
      file_size,
      file_mime,
      created_at: new Date()
    });
  } catch (mongoErr: any) {
    console.error('[CHAT MONGO SYNC ERROR]', mongoErr.message);
  }

  // If 1-on-1 direct message, dispatch a system notification to the recipient
  if (targetRecipientId) {
    const snippet = message_text ? (message_text.length > 50 ? message_text.substring(0, 47) + '...' : message_text) : `Sent an attachment (${file_name || message_type})`;
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'CHAT_MESSAGE', ?, ?)
    `).run(
      targetRecipientId,
      `New message from ${user.name}`,
      snippet
    );
  }

  res.status(201).json({
    message: 'Message sent successfully',
    chatMessage: newMsg
  });
});

export default router;
