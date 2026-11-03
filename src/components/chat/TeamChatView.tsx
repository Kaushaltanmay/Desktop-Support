import React, { useState, useEffect, useRef } from 'react';
import { api, getApiBase } from '../../services/api';
import { LiveCallModal } from './LiveCallModal';
import { 
  Send, 
  Paperclip, 
  Phone, 
  Video, 
  Monitor, 
  Search, 
  Users, 
  Smile, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  CheckCheck, 
  MoreVertical, 
  X, 
  Check, 
  FileSpreadsheet,
  Archive,
  Clock,
  Sparkles,
  Info,
  ArrowLeft
} from 'lucide-react';

interface TeamChatViewProps {
  currentUser: any;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeamChatView: React.FC<TeamChatViewProps> = ({
  currentUser,
  showToast
}) => {
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [conversations, setConversations] = useState<any[]>([]);
  const [generalChannel, setGeneralChannel] = useState<any>({
    id: 0,
    name: 'All Team Hub',
    description: 'Company-wide team chat & announcements',
    role: 'GROUP',
    department_name: 'Fly Media Technology',
    isGeneral: true
  });
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<{ url: string; name?: string; downloadUrl?: string } | null>(null);

  // Live Calling & Screen Sharing state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callMode, setCallMode] = useState<'AUDIO' | 'VIDEO' | 'SCREEN_SHARE'>('VIDEO');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Emoji options
  const emojis = ['👍', '❤️', '🙏', '🚀', '😊', '🔥', '🎉', '💻'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all conversations list
  const fetchConversations = async (keepActive = true) => {
    try {
      const res = await api.chat.getConversations();
      setConversations(res.conversations || []);
      if (res.generalChannel) {
        setGeneralChannel(res.generalChannel);
      }
      if (!keepActive && !activeContact) {
        // Default to General Channel
        setActiveContact(res.generalChannel || { id: 0, name: 'All Team Hub', isGeneral: true });
      }
    } catch (err) {
      console.error('Failed to load chat conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for active contact
  const fetchMessages = async (targetId: number | string) => {
    try {
      const res = await api.chat.getMessages(targetId);
      setMessages(res.messages || []);
      setTimeout(scrollToBottom, 60);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations(false);
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  // Live auto-polling every 2.5 seconds for instant WhatsApp-like message delivery
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeContact) {
        api.chat.getMessages(activeContact.id).then(res => {
          if (res.messages && res.messages.length !== messages.length) {
            setMessages(res.messages);
            scrollToBottom();
          }
        }).catch(() => {});
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeContact, messages.length]);

  // Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeContact) return;

    const textToSend = messageText.trim();
    setMessageText('');

    try {
      const recipientId = activeContact.isGeneral ? null : activeContact.id;
      const res = await api.chat.sendMessage({
        recipient_id: recipientId,
        message_text: textToSend,
        message_type: 'TEXT'
      });

      setMessages(prev => [...prev, res.chatMessage]);
      setTimeout(scrollToBottom, 60);
      fetchConversations(true);
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed to send message', 'error');
    }
  };

  // Upload File / Media Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    try {
      setUploading(true);
      const uploaded = await api.chat.uploadFile(file);

      // Now create chat message with attachment
      const recipientId = activeContact.isGeneral ? null : activeContact.id;
      const res = await api.chat.sendMessage({
        recipient_id: recipientId,
        message_text: messageText.trim() || `Sent an attachment: ${uploaded.fileName}`,
        message_type: uploaded.messageType,
        file_url: uploaded.fileUrl,
        file_name: uploaded.fileName,
        file_size: uploaded.fileSize,
        file_mime: uploaded.mimeType
      });

      setMessageText('');
      setMessages(prev => [...prev, res.chatMessage]);
      setTimeout(scrollToBottom, 60);
      fetchConversations(true);
      if (showToast) showToast(`File ${uploaded.fileName} shared with team.`, 'success');
    } catch (err: any) {
      if (showToast) showToast(err.message || 'File upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Launch Live Audio / Video / Screen Share Call
  const handleStartCall = (mode: 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE') => {
    setCallMode(mode);
    setIsCallModalOpen(true);
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredConversations = conversations.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.department_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.designation?.toLowerCase().includes(search.toLowerCase())
  );

  // Format relative timestamp
  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const apiHost = getApiBase().replace(/\/api$/, '');

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
      return apiHost ? `${apiHost}${url}` : url;
    }
    return `${apiHost}${url}`;
  };

  const getDownloadUrl = (url: string, name?: string) => {
    if (!url) return '';
    const filename = url.split('/').pop() || '';
    const base = getApiBase();
    return `${base}/chat/download/${filename}?name=${encodeURIComponent(name || filename)}`;
  };

  return (
    <div className="team-chat-container animate-fade-in" style={{
      display: 'flex',
      flex: 1,
      height: '100%',
      minHeight: 0,
      background: '#ffffff',
      borderRadius: isMobileScreen ? '0px' : '16px',
      border: isMobileScreen ? 'none' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: isMobileScreen ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.04)'
    }}>
      
      {/* ============================================================== */}
      {/* LEFT SIDEBAR: CONVERSATIONS LIST & SEARCH                      */}
      {/* ============================================================== */}
      <div style={{
        width: isMobileScreen ? '100%' : '320px',
        borderRight: isMobileScreen ? 'none' : '1px solid #e2e8f0',
        display: isMobileScreen && activeContact ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        flexShrink: 0,
        height: '100%',
        minHeight: 0
      }}>
        {/* User Profile Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              <span style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #ffffff'
              }} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {currentUser?.name}
              </h4>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Online • {currentUser?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '32px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                paddingTop: '7px',
                paddingBottom: '7px'
              }}
            />
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          
          {/* General Company Channel */}
          <div
            onClick={() => setActiveContact(generalChannel)}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              background: (activeContact?.id === 0 || activeContact?.isGeneral) ? '#f0f9ff' : 'transparent',
              borderLeft: (activeContact?.id === 0 || activeContact?.isGeneral) ? '3px solid #0284c7' : '3px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                  # All Team Hub
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {formatTime(generalChannel.last_message_time)}
                </span>
              </div>
              <p style={{
                fontSize: '0.74rem',
                color: '#64748b',
                margin: '2px 0 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {generalChannel.last_message}
              </p>
            </div>
          </div>

          <div style={{ padding: '6px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Direct Messages
          </div>

          {/* Direct Colleagues List */}
          {filteredConversations.map(member => {
            const isActive = activeContact?.id === member.id;
            const initial = member.name.charAt(0).toUpperCase();

            return (
              <div
                key={member.id}
                onClick={() => setActiveContact(member)}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  background: isActive ? '#f0f9ff' : 'transparent',
                  borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: member.role === 'HR' ? '#faf5ff' : member.role === 'IT_ENGINEER' ? '#e0f2fe' : '#f1f5f9',
                    color: member.role === 'HR' ? '#7c3aed' : member.role === 'IT_ENGINEER' ? '#0284c7' : '#475569',
                    fontWeight: 700,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    {initial}
                  </div>
                  {member.is_online && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '2px solid #ffffff'
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                      {member.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {formatTime(member.last_message_time)}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.74rem',
                    color: member.unread_count > 0 ? '#0f172a' : '#64748b',
                    fontWeight: member.unread_count > 0 ? 600 : 400,
                    margin: '2px 0 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {member.last_message}
                  </p>
                </div>

                {member.unread_count > 0 && (
                  <span style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {member.unread_count}
                  </span>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT CHAT CANVAS: ACTIVE ROOM, MEDIA, MESSAGES, CALLS         */}
      {/* ============================================================== */}
      <div style={{
        flex: 1,
        display: isMobileScreen && !activeContact ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        position: 'relative',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {activeContact ? (
          <>
            {/* WhatsApp-Style Top Active Chat Header */}
            <div style={{
              padding: '12px 20px',
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10,
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isMobileScreen && (
                  <button
                    type="button"
                    onClick={() => setActiveContact(null)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Back to conversations list"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                )}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: activeContact.isGeneral ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : '#e0f2fe',
                  color: activeContact.isGeneral ? '#ffffff' : '#0284c7',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {activeContact.isGeneral ? <Users size={20} /> : activeContact.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeContact.name}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600, margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeContact.isGeneral ? 'Team Channel • All Employees' : `${activeContact.designation || activeContact.role} • ${activeContact.department_name || 'Fly Media'}`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar: Call, Video, Screen Share */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {/* Audio Call */}
                <button
                  onClick={() => handleStartCall('AUDIO')}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    color: '#334155',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Start Peer-to-Peer Audio Call"
                >
                  <Phone size={15} color="#0284c7" />
                  <span className="desktop-only">Audio</span>
                </button>

                {/* Video Call */}
                <button
                  onClick={() => handleStartCall('VIDEO')}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    color: '#334155',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Start Live HD Video Conference"
                >
                  <Video size={15} color="#7c3aed" />
                  <span className="desktop-only">Video</span>
                </button>

                {/* PC Screen Share */}
                <button
                  onClick={() => handleStartCall('SCREEN_SHARE')}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    padding: isMobileScreen ? '8px 10px' : '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                  }}
                  title="Share your entire PC Desktop, Window or Tab"
                >
                  <Monitor size={15} />
                  <span className="desktop-only">Screen</span>
                </button>
              </div>
            </div>

            {/* Messages Scrollable Area */}
            <div 
              className="chat-messages-container"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                  <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.86rem', fontWeight: 600 }}>No messages yet</p>
                  <p style={{ fontSize: '0.76rem' }}>Send a message or drop a file to start collaborating!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOutgoing = msg.sender_id === currentUser?.id;
                  const isImage = msg.message_type === 'IMAGE' && msg.file_url;
                  const isVideo = msg.message_type === 'VIDEO' && msg.file_url;
                  const isAudio = msg.message_type === 'AUDIO' && msg.file_url;
                  const isDocument = (msg.message_type === 'DOCUMENT' || msg.message_type === 'FILE') && msg.file_url;

                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOutgoing ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Sender Name in General Channel */}
                      {activeContact.isGeneral && !isOutgoing && (
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginLeft: '8px', marginBottom: '2px' }}>
                          {msg.sender_name} ({msg.sender_role})
                        </span>
                      )}

                      {/* Bubble Container */}
                      <div style={{
                        maxWidth: '75%',
                        background: isOutgoing ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                        color: isOutgoing ? '#ffffff' : '#0f172a',
                        padding: '10px 14px',
                        borderRadius: isOutgoing ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        border: isOutgoing ? 'none' : '1px solid #e2e8f0',
                        fontSize: '0.86rem',
                        lineHeight: 1.45,
                        position: 'relative'
                      }}>
                        
                        {/* 1. Image Preview */}
                        {isImage && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ position: 'relative' }}>
                              <img
                                src={getMediaUrl(msg.file_url)}
                                alt={msg.file_name || 'Photo attachment'}
                                onClick={() => setSelectedImageModal({
                                  url: getMediaUrl(msg.file_url),
                                  name: msg.file_name,
                                  downloadUrl: getDownloadUrl(msg.file_url, msg.file_name)
                                })}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '280px',
                                  borderRadius: '10px',
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  display: 'block'
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '8px' }}>
                              <span style={{ fontSize: '0.68rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {msg.file_name} ({formatFileSize(msg.file_size)})
                              </span>
                              <a
                                href={getDownloadUrl(msg.file_url, msg.file_name)}
                                download={msg.file_name || 'image'}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.68rem',
                                  color: isOutgoing ? '#ffffff' : '#0284c7',
                                  textDecoration: 'none',
                                  fontWeight: 700,
                                  opacity: 0.95
                                }}
                              >
                                <Download size={12} />
                                <span>Save</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 2. Video Player */}
                        {isVideo && (
                          <div style={{ marginBottom: '8px' }}>
                            <video
                              src={getMediaUrl(msg.file_url)}
                              controls
                              playsInline
                              style={{
                                width: '100%',
                                maxHeight: '280px',
                                borderRadius: '10px',
                                background: '#000000',
                                display: 'block'
                              }}
                            />
                            <span style={{ fontSize: '0.68rem', opacity: 0.8, display: 'block', marginTop: '3px' }}>
                              🎥 {msg.file_name} ({formatFileSize(msg.file_size)})
                            </span>
                          </div>
                        )}

                        {/* 3. Audio Voice Message Player */}
                        {isAudio && (
                          <div style={{ marginBottom: '6px', minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <Music size={14} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Audio Message</span>
                            </div>
                            <audio
                              src={getMediaUrl(msg.file_url)}
                              controls
                              style={{ width: '100%', height: '36px' }}
                            />
                            <span style={{ fontSize: '0.66rem', opacity: 0.8, display: 'block', marginTop: '2px' }}>
                              {msg.file_name} ({formatFileSize(msg.file_size)})
                            </span>
                          </div>
                        )}

                        {/* 4. Document / Generic File Download Card */}
                        {isDocument && (
                          <div style={{
                            background: isOutgoing ? 'rgba(255, 255, 255, 0.15)' : '#f8fafc',
                            border: `1px solid ${isOutgoing ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '6px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                background: isOutgoing ? '#ffffff' : '#0284c7',
                                color: isOutgoing ? '#0284c7' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <FileText size={18} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p style={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  margin: 0,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {msg.file_name || 'Document'}
                                </p>
                                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                  {formatFileSize(msg.file_size)} • {msg.file_mime || 'File'}
                                </span>
                              </div>
                            </div>

                            <a
                              href={getDownloadUrl(msg.file_url, msg.file_name)}
                              download={msg.file_name || 'download'}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: isOutgoing ? '#ffffff' : '#0284c7',
                                color: isOutgoing ? '#0284c7' : '#ffffff',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0
                              }}
                            >
                              <Download size={13} />
                              <span>Get</span>
                            </a>
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.message_text && (!isDocument || msg.message_text !== `Sent an attachment: ${msg.file_name}`) && (
                          <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {msg.message_text}
                          </div>
                        )}

                        {/* Timestamp & Double Checkmark */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px',
                          marginTop: '4px',
                          fontSize: '0.65rem',
                          opacity: 0.8
                        }}>
                          <span>{formatTime(msg.created_at)}</span>
                          {isOutgoing && (
                            <CheckCheck size={13} color={msg.is_read ? '#67e8f9' : '#e2e8f0'} />
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Composition Bar */}
            <div style={{
              padding: '12px 18px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              {/* Quick Emojis strip */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '2px', flexShrink: 0 }}>
                {emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessageText(prev => prev + emoji)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '16px',
                      padding: '2px 8px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'transform 0.1s'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    color: '#475569',
                    flexShrink: 0
                  }}
                  title="Attach Photo, Video, Audio, PDF, Excel or Document"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Text Input */}
                <input
                  data-chat-input="true"
                  type="text"
                  placeholder={uploading ? 'Uploading attachment...' : `Message ${activeContact.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '0.86rem',
                    outline: 'none'
                  }}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={uploading || !messageText.trim()}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: messageText.trim() ? '#0284c7' : '#e2e8f0',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: messageText.trim() ? 'pointer' : 'default',
                    boxShadow: messageText.trim() ? '0 2px 6px rgba(2, 132, 199, 0.4)' : 'none',
                    flexShrink: 0,
                    transition: 'all 0.15s'
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
              Fly Media Unified Team Chat
            </h3>
            <p style={{ fontSize: '0.82rem', maxWidth: '320px', margin: '4px auto 0' }}>
              Select a colleague from the left or jump into the #All Team Hub to start messaging, file sharing, and calling.
            </p>
          </div>
        )}
      </div>

      {/* Image Lightbox Preview Modal with High-Visibility Header and Close Cross */}
      {selectedImageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Top Control Bar with Back to Chat, Download, and Prominent Red Close (X) button */}
          <div style={{
            height: '64px',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.55)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            flexShrink: 0
          }}>
            <button
              onClick={() => setSelectedImageModal(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
              <span>Back to Chat</span>
            </button>

            <span style={{
              color: '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 500,
              maxWidth: '40%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {selectedImageModal.name || 'Image Preview'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href={selectedImageModal.downloadUrl || selectedImageModal.url}
                download={selectedImageModal.name || 'image'}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Download size={16} />
                <span>Save</span>
              </a>

              <button
                onClick={() => setSelectedImageModal(null)}
                title="Close Image Preview (Esc)"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
                }}
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Center Image Container */}
          <div
            onClick={() => setSelectedImageModal(null)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflow: 'hidden'
            }}
          >
            <img
              src={selectedImageModal.url}
              alt={selectedImageModal.name || 'Enlarged preview'}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '96vw',
                maxHeight: 'calc(100vh - 120px)',
                objectFit: 'contain',
                borderRadius: '10px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
              }}
            />
          </div>
        </div>
      )}

      {/* Live Peer-to-Peer Calling & Screen Share Modal */}
      <LiveCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        targetUser={activeContact}
        currentUser={currentUser}
        initialMode={callMode}
      />

    </div>
  );
};