import { Capacitor } from '@capacitor/core';

export const DEFAULT_LAN_API = 'http://192.168.1.72:5000/api';
export const DEFAULT_EMULATOR_API = 'http://10.0.2.2:5000/api';

export function getApiBase(): string {
  // 1. Check user-configured override in localStorage
  const saved = localStorage.getItem('desktop_support_api_url');
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/$/, '');
  }

  // 2. Check Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }

  // 3. If running on native mobile device (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    return DEFAULT_EMULATOR_API;
  }

  // 4. Default web proxy
  return '/api';
}

export function setApiBase(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem('desktop_support_api_url');
  } else {
    localStorage.setItem('desktop_support_api_url', url.trim().replace(/\/$/, ''));
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('desktop_support_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  system: {
    checkHealth: async (customBase?: string) => {
      const base = (customBase || getApiBase()).replace(/\/$/, '');
      const start = Date.now();
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) });
      const latency = Date.now() - start;
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();
      return { ok: true, latency, data };
    }
  },

  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getMe: () => request<{ user: any }>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },

  dashboard: {
    getStats: () => request<any>('/dashboard/stats'),
  },

  tickets: {
    getAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ tickets: any[] }>(`/tickets${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string | number) =>
      request<{ ticket: any; comments: any[]; history: any[]; audits: any[] }>(`/tickets/${id}`),
    create: (data: {
      category: string;
      priority: string;
      subject: string;
      description: string;
      device_id?: number | null;
      attachment_url?: string | null;
    }) =>
      request<{ message: string; ticketNumber: string; ticket: any }>('/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: { status?: string; priority?: string }) =>
      request<{ message: string }>(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    addComment: (id: string | number, comment: string) =>
      request<{ message: string; comment: any }>(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
    assign: (id: string | number, assigned_to: number) =>
      request<{ message: string; assigned_to: number; assignee_name: string; status: string }>(
        `/tickets/${id}/assign`,
        {
          method: 'POST',
          body: JSON.stringify({ assigned_to }),
        }
      ),
    resolve: (id: string | number, resolution_notes: string) =>
      request<{
        message: string;
        resolution_time_seconds: number;
        resolution_time_formatted: string;
        resolution_notes: string;
      }>(`/tickets/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes }),
      }),
    reopen: (id: string | number, reason?: string) =>
      request<{ message: string; status: string }>(`/tickets/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  devices: {
    getAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ devices: any[] }>(`/devices${qs ? `?${qs}` : ''}`);
    },
    create: (data: any) =>
      request<{ message: string; device: any }>('/devices', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request<{ message: string }>(`/devices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/devices/${id}`, {
        method: 'DELETE',
      }),
    bulkImport: (devices: any[]) =>
      request<{ message: string; importedCount: number; skippedCount: number; errors: string[] }>('/devices/bulk', {
        method: 'POST',
        body: JSON.stringify({ devices }),
      }),
  },

  users: {
    getAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ users: any[]; departments: any[]; roles?: any[] }>(`/users${qs ? `?${qs}` : ''}`);
    },
    create: (data: any) =>
      request<{ message: string; user: any; credentials?: any }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request<{ message: string; user: any }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    resetPassword: (id: number, data: { newPassword: string }) =>
      request<{ message: string; username?: string; email?: string; newPassword?: string }>(`/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/users/${id}`, {
        method: 'DELETE',
      }),
    bulkImport: (employees: any[]) =>
      request<{ message: string; importedCount: number; skippedCount: number; credentials?: any[]; errors: string[] }>('/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ employees }),
      }),
    getRoles: () =>
      request<{ roles: any[] }>('/users/roles'),
  },

  feedback: {
    create: (data: { reported_against_id?: number | null; category: string; severity?: string; subject: string; description: string; is_anonymous?: boolean }) =>
      request<{ message: string; feedbackId: number }>('/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: () =>
      request<{ feedbacks: any[] }>('/feedback'),
    update: (id: number, data: { status: string; hr_notes?: string }) =>
      request<{ message: string }>(`/feedback/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  chat: {
    getConversations: () =>
      request<{ conversations: any[]; generalChannel: any }>('/chat/conversations'),
    getMessages: (targetId: number | string) =>
      request<{ messages: any[] }>(`/chat/messages/${targetId}`),
    sendMessage: (data: {
      recipient_id?: number | null;
      message_text?: string;
      message_type?: string;
      file_url?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      file_mime?: string | null;
    }) =>
      request<{ message: string; chatMessage: any }>('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('desktop_support_token');
      const res = await fetch(`${getApiBase()}/chat/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'File upload failed');
      }
      return res.json() as Promise<{
        message: string;
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        messageType: string;
      }>;
    }
  },

  audit: {
    getLogs: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ auditLogs: any[] }>(`/audit-logs${qs ? `?${qs}` : ''}`);
    },
  },

  notifications: {
    getAll: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
    markRead: (id: number) => request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),
  },

  reports: {
    getStats: (timeframe: string = '30days') =>
      request<any>(`/reports?timeframe=${timeframe}`),
  },

  attendance: {
    getToday: () => request<{ today: string; attendance: any; office: any; workingStatus: 'NOT_PUNCHED' | 'WORKING' | 'PUNCHED_OUT' }>('/attendance/today'),
    punchIn: (data: { latitude: number; longitude: number; accuracy?: number; device_information?: string }) =>
      request<{ message: string; attendance: any; distanceMeters: number; lateMinutes: number }>('/attendance/punch-in', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    punchOut: (data: { latitude: number; longitude: number; accuracy?: number; device_information?: string }) =>
      request<{ message: string; attendance: any; totalWorkMinutes: number; formattedWorkHours: string; formattedOvertime: string; status: string; distanceMeters: number }>('/attendance/punch-out', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyHistory: (month?: string) =>
      request<{ month: string; summary: any; records: any[] }>(`/attendance/me${month ? `?month=${month}` : ''}`),
    getAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ records: any[] }>(`/attendance${qs ? `?${qs}` : ''}`);
    },
    getById: (id: number | string) =>
      request<{ record: any; events: any[] }>(`/attendance/${id}`),
    correct: (id: number | string, data: { punch_in_at?: string; punch_out_at?: string; status?: string; reason: string }) =>
      request<{ message: string; attendanceId: any; newStatus: string }>(`/attendance/${id}/correct`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  leaves: {
    getTypes: () => request<{ types: any[] }>('/leaves/types'),
    getBalances: () => request<{ year: number; balances: any[] }>('/leaves/balances'),
    apply: (data: { leave_type_id: number; start_date: string; end_date: string; reason: string; attachment_url?: string }) =>
      request<{ message: string; requestId: number; numberOfDays: number }>('/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ leaves: any[] }>(`/leaves${qs ? `?${qs}` : ''}`);
    },
    approve: (id: number | string, review_comment?: string) =>
      request<{ message: string }>(`/leaves/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ review_comment }),
      }),
    reject: (id: number | string, review_comment?: string) =>
      request<{ message: string }>(`/leaves/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ review_comment }),
      }),
  },

  hr: {
    getDashboard: () => request<{ today: string; metrics: any; todayRoster: any[] }>('/hr/dashboard'),
  },

  offices: {
    getAll: () => request<{ offices: any[] }>('/offices'),
    update: (id: number, data: any) =>
      request<{ message: string }>(`/offices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  holidays: {
    getAll: () => request<{ holidays: any[] }>('/holidays'),
    create: (data: { name: string; date: string; description?: string }) =>
      request<{ message: string; id: number }>('/holidays', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  schedules: {
    getAll: () => request<{ schedules: any[] }>('/work-schedules'),
  },
};
