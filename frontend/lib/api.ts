import type { DeliveryRecord } from "@/components/delivery/deliveryData";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DashboardData {
  activeDeliveries: number;
  completedDeliveries: number;
  followUps: number;
  avgEta: string;
  routeUpdates: number;
  activeRoutes: DeliveryRecord[];
}

export interface EarningsResponse {
  earned: number;
  orders: number;
  bonus?: number;
  totalWithBonus?: number;
  highlights: Array<{
    title: string;
    value: string;
    description?: string;
  }>;
  incentives: Array<{
    label: string;
    amount: string;
  }>;
  meta?: {
    perOrderBase?: number;
    perOrderPremium?: number;
    premiumThreshold?: number;
    bonusThreshold?: number;
    bonusAmount?: number;
  };
}

export interface LocationUpdatePayload {
  deliveryId: string;
  latitude: number;
  longitude: number;
  source: "manual" | "browser";
  displayName: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timestamp: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  orderCode?: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface CustomerAnalyticsSummary {
  totalOrders: number;
  deliveredOrders: number;
  completedOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  totalSpending: number;
  monthlyStats: Array<{
    month: string;
    monthKey: string;
    orders: number;
    spending: number;
  }>;
  orderStatusDistribution: Array<{
    name: string;
    value: number;
  }>;
}

function getApiBaseUrl() {
  return API_BASE_URL;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const adminKey =
    typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") : null;

  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(adminKey ? { "x-admin-key": adminKey } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Request failed with status ${response.status}`,
    );
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    throw new Error("Invalid response received from server. Please try again.");
  }

  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

/* =========================
   Existing APIs
========================= */

export async function fetchOrders(search?: string): Promise<any[]> {
  const path = search
    ? `/api/customer/orders?search=${encodeURIComponent(search)}`
    : "/api/customer/orders";
  return apiRequest<any[]>(path);
}

export async function fetchProducts(): Promise<any[]> {
  return apiRequest<any[]>("/api/customer/products");
}

// Customer-specific endpoints (public-facing)
export async function fetchCustomerOrders(): Promise<any[]> {
  return apiRequest<any[]>("/api/customer/orders");
}

export async function fetchCustomerProducts(): Promise<any[]> {
  return apiRequest<any[]>("/api/customer/products");
}

export async function createCustomerOrder(orderData: unknown): Promise<any> {
  return apiRequest<any>("/api/customer/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function requestRegistrationOtp(email: string): Promise<{
  email: string;
  resendAfterSeconds: number;
  expiresAt: string;
}> {
  return apiRequest<{
    email: string;
    resendAfterSeconds: number;
    expiresAt: string;
  }>("/api/auth/register/request-otp", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function verifyRegistrationOtp(
  payloadOrEmail: { email: string; otp: string } | string,
  otpCode?: string,
): Promise<{ email: string; registrationToken: string }> {
  const payload =
    typeof payloadOrEmail === "string"
      ? { email: payloadOrEmail.trim().toLowerCase(), otp: (otpCode || "").trim() }
      : { email: payloadOrEmail.email.trim().toLowerCase(), otp: payloadOrEmail.otp.trim() };

  return apiRequest<{ email: string; registrationToken: string }>(
    "/api/auth/register/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function completeRegistration(
  payload:
    | FormData
    | {
        registrationToken: string;
        fullName: string;
        email: string;
        password: string;
        confirmPassword?: string;
        role: string;
      },
): Promise<any> {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;

  return apiRequest<any>("/api/auth/register", {
    method: "POST",
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function deleteCurrentAccount(payload: {
  currentPassword: string;
  confirmText: string;
}): Promise<any> {
  return apiRequest<any>("/api/auth/account", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function fetchTrackingByOrderId(orderId: string): Promise<any> {
  return apiRequest<any>(`/api/tracking/order/${orderId}`);
}

export async function fetchDeliveryByOrderId(orderId: string): Promise<any> {
  return apiRequest<any>(`/api/delivery/order/${orderId}`);
}

export interface OwnerAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalDeliveredOrders: number;
  salesGrowthPercent: number;
  lowStockCount: number;
  totalProducts?: number;
  healthyCount?: number;
  noStockCount?: number;
  last30Revenue: number;
  prev30Revenue: number;
  last30Orders: number;
  prev30Orders: number;
  last30DeliveredOrders: number;
  prev30DeliveredOrders: number;
}

export async function fetchAnalytics(): Promise<OwnerAnalyticsData> {
  return apiRequest<OwnerAnalyticsData>("/api/analytics");
}

export async function fetchDashboardStats(): Promise<any> {
  return apiRequest<any>("/api/stats");
}

/* =========================
   Owner APIs
========================= */
export async function fetchOwnerProducts(): Promise<any[]> {
  return apiRequest<any[]>("/api/products");
}

export async function fetchOwnerProductById(id: string): Promise<any> {
  return apiRequest<any>(`/api/products/${id}`);
}

export async function createOwnerProduct(payload: unknown): Promise<any> {
  return apiRequest<any>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerProduct(
  id: string,
  payload: unknown,
): Promise<any> {
  return apiRequest<any>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteOwnerProduct(id: string): Promise<any> {
  return apiRequest<any>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export async function fetchOwnerInventory(): Promise<any> {
  return apiRequest<any>("/api/inventory");
}

export async function fetchOwnerInventoryHistory(): Promise<any> {
  return apiRequest<any>("/api/inventory/history");
}

export async function updateOwnerStock(
  productId: string,
  payload: unknown,
): Promise<any> {
  return apiRequest<any>(`/api/inventory/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchOwnerOrders(): Promise<any[]> {
  return apiRequest<any[]>("/api/orders/business");
}

export async function fetchOwnerDeliveries(params?: {
  owner?: boolean;
  status?: string;
  mine?: boolean;
}): Promise<any> {
  let path = "/api/deliveries";
  const qs: string[] = [];
  if (params?.owner) qs.push("owner=true");
  if (params?.status) qs.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.mine) qs.push("mine=true");
  if (qs.length) path += `?${qs.join("&")}`;
  return apiRequest<any>(path);
}

export async function assignOrderToAgent(orderId: string, agentId: string) {
  return apiRequest<any>(`/api/deliveries/orders/${orderId}/assign`, {
    method: "POST",
    body: JSON.stringify({ agentId }),
  });
}

export async function fetchOwnerDeliveryAgents(): Promise<any> {
  return apiRequest<any>("/api/delivery-agents");
}

export async function createOwnerDeliveryAgent(payload: unknown): Promise<any> {
  return apiRequest<any>("/api/delivery-agents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================
   Delivery APIs
========================= */

export async function fetchDashboard(): Promise<DashboardData> {
  return apiRequest<DashboardData>("/api/deliveries/dashboard");
}

export async function fetchDeliveries(): Promise<DeliveryRecord[]> {
  // Fetch only deliveries assigned to the logged-in agent
  return apiRequest<DeliveryRecord[]>("/api/deliveries?mine=true");
}

export async function claimDelivery(orderId: string): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>(`/api/deliveries/orders/${orderId}/claim`, {
    method: "POST",
  });
}

export async function requestDeliveryOtp(
  orderId: string,
): Promise<{ success: boolean; message: string; expiresAt: string }> {
  return apiRequest<{
    success: boolean;
    message: string;
    expiresAt: string;
  }>(`/api/deliveries/orders/${orderId}/generate-otp`, {
    method: "POST",
  });
}

export async function verifyCustomerDeliveryOtp(
  orderId: string,
  otp: string,
): Promise<{
  success: boolean;
  message: string;
  orderId: string;
  customerVerified: boolean;
  verifiedAt: string;
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    orderId: string;
    customerVerified: boolean;
    verifiedAt: string;
  }>(`/api/deliveries/orders/${orderId}/verify-customer`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export async function acceptDelivery(
  orderOrDeliveryId: string,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>(
    `/api/deliveries/orders/${orderOrDeliveryId}/accept`,
    {
      method: "POST",
    },
  );
}

export async function fetchHistory(): Promise<DeliveryRecord[]> {
  return apiRequest<DeliveryRecord[]>("/api/deliveries/history");
}

export async function fetchEarnings(): Promise<EarningsResponse> {
  return apiRequest<EarningsResponse>("/api/deliveries/earnings");
}

export async function updateDeliveryStatus(
  id: string,
  status: string,
  otp?: string,
  completionPhoto?: string,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>(`/api/deliveries/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, otp, completionPhoto }),
  });
}

export async function createDelivery(
  payload: Partial<DeliveryRecord>,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>("/api/deliveries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDelivery(
  id: string,
  payload: Partial<DeliveryRecord>,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>(`/api/deliveries/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDelivery(id: string): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/api/deliveries/${id}`, {
    method: "DELETE",
  });
}

export async function saveLocationUpdate(
  payload: LocationUpdatePayload,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>("/api/location-updates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchLatestLocationUpdate(
  deliveryId: string,
): Promise<any> {
  return apiRequest<any>(
    `/api/location-updates/latest?deliveryId=${encodeURIComponent(deliveryId)}`,
  );
}

export async function fetchCurrentUser(): Promise<any> {
  return apiRequest<any>("/api/auth/me");
}

export async function updateCurrentUser(payload: {
  fullName?: string;
  phone?: string;
  businessName?: string;
  gstNumber?: string;
  businessAddress?: string;
}): Promise<any> {
  return apiRequest<any>("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateCurrentPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<any> {
  return apiRequest<any>("/api/auth/me/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchNotifications(): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>("/api/notifications");
}

export async function markNotificationRead(
  id: string,
): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>("/api/notifications/read-all", {
    method: "PATCH",
  });
}

export async function fetchCustomerAnalyticsSummary(): Promise<CustomerAnalyticsSummary> {
  return apiRequest<CustomerAnalyticsSummary>(
    "/api/customer/analytics/summary",
  );
}

/* =========================
   Admin APIs
========================= */

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
}

export interface AdminDocument {
  path: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
}

export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  applicationRejectionReason?: string;
  businessName?: string;
  gstNumber?: string;
  businessAddress?: string;
  documents: {
    aadhaar: AdminDocument;
    drivingLicense: AdminDocument;
    gstCertificate: AdminDocument;
    shopLicense: AdminDocument;
  };
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/api/admin/stats");
}

export async function fetchAdminPendingUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/api/admin/pending");
}

export async function fetchAdminApprovedUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/api/admin/approved");
}

export async function fetchAdminRejectedUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/api/admin/rejected");
}

export async function approveAdminUser(id: string): Promise<{ message: string; user: AdminUser }> {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/approve/${id}`, {
    method: "PATCH",
  });
}

export async function rejectAdminUser(
  id: string,
  rejectionReason: string,
): Promise<{ message: string; user: AdminUser }> {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/reject/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
}

export async function updateAdminDocumentStatus(
  userId: string,
  documentName: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense",
  status: "approved" | "rejected",
  rejectionReason?: string,
): Promise<{ message: string; user: AdminUser }> {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/${userId}/document`, {
    method: "PATCH",
    body: JSON.stringify({ documentName, status, rejectionReason: rejectionReason || "" }),
  });
}

