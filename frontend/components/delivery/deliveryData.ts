export type DeliveryStatus =
  | "Pending"
  | "pending"
  | "Assigned"
  | "assigned"
  | "Shipped"
  | "shipped"
  | "Out for Delivery"
  | "out-for-delivery"
  | "Delivered"
  | "delivered"
  | "Completed"
  | "completed"
  | "Failed Attempt"
  | "failed-attempt"
  | "Failed"
  | "failed"
  | "Returned"
  | "returned"
  | "Cancelled"
  | "cancelled";

export type DeliveryPriority = "High" | "Medium" | "Low" | "Normal";

export interface DeliveryRecord {
  id: string;
  orderId?: string;
  customer: string;
  address: string;
  fullAddress?: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  eta: string;
  status: DeliveryStatus;
  priority: DeliveryPriority | null;
  contact: string;
  customerPhone?: string;
  customerVerified?: boolean;
  verifiedAt?: string | null;
  isClaimed?: boolean;
  agent?: {
    _id: string;
    name: string;
    email?: string | null;
  };
  location: string | null;
  lastUpdated: string | null;
  raw?: any;
}
