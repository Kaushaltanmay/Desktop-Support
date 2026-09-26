// REST API Client for Desktop IT Support

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('desktop_support_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
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
  },

  users: {
    getAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<{ users: any[]; departments: any[] }>(`/users${qs ? `?${qs}` : ''}`);
    },
    create: (data: any) =>
      request<{ message: string; user: any }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
