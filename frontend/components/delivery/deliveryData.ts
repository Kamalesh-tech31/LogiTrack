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
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  pickupName?: string | null;
  pickupAddress?: any;
  deliveryAddress?: any;
  deliveryStage?:
    | "UNCLAIMED"
    | "TO_WAREHOUSE"
    | "AT_WAREHOUSE"
    | "TO_CUSTOMER"
    | "AT_CUSTOMER"
    | "OTP_REQUESTED"
    | "DELIVERED";
  isClaimed?: boolean;
  isMyDelivery?: boolean;
  isClaimable?: boolean;
  agentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    updatedAt?: string | null;
  } | null;
  eta: string;
  status: DeliveryStatus;
  priority: DeliveryPriority | null;
  contact: string;
  agent?: {
    _id: string;
    name: string;
    email?: string | null;
  };
  customerVerified?: boolean;
  verifiedAt?: string | null;
  claimedAt?: string | null;
  batchId?: string | null;
  sequenceOrder?: number | null;
  hasActiveOtp?: boolean;
  otpExpiresAt?: string | null;
  location: string | null;
  lastUpdated: string | null;
  raw?: any;
}
