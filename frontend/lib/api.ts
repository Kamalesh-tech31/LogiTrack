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

function getApiBaseUrl() {
  return API_BASE_URL;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  console.log("TOKEN:", token);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,

    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Request failed with status ${response.status}`,
    );
  }

  const json = await response.json();

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
    body: JSON.stringify({ email }),
  });
}

export async function verifyRegistrationOtp(payload: {
  email: string;
  otp: string;
}): Promise<{ email: string; registrationToken: string }> {
  return apiRequest<{ email: string; registrationToken: string }>(
    "/api/auth/register/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function completeRegistration(payload: {
  registrationToken: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): Promise<any> {
  return apiRequest<any>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
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
  salesGrowthPercent: number;
  lowStockCount: number;
  last30Revenue: number;
  prev30Revenue: number;
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
  completionOtp?: string,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>(`/api/deliveries/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, completionOtp }),
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
