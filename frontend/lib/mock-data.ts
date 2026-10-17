export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
}

export interface Order {
  id: string
  customer: string
  status: "delivered" | "pending" | "shipped"
  amount: number
  date: string
}

export interface TrackingStep {
  id: string
  title: string
  description: string
  status: "completed" | "in-progress" | "pending"
  timestamp?: string
}

export const products: Product[] = [
  {
    id: "1",
    name: "Premium Headphones",
    price: 4999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Audio"
  },
  {
    id: "2",
    name: "Gaming Mouse",
    price: 2499,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop",
    category: "Accessories"
  },
  {
    id: "3",
    name: "Smart Watch",
    price: 7999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Wearables"
  },
  {
    id: "4",
    name: "Mechanical Keyboard",
    price: 6499,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop",
    category: "Accessories"
  },
  {
    id: "5",
    name: "Wireless Earbuds",
    price: 3499,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    category: "Audio"
  },
  {
    id: "6",
    name: "USB-C Hub",
    price: 1999,
    image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=400&fit=crop",
    category: "Accessories"
  },
  {
    id: "7",
    name: "Portable SSD",
    price: 5499,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop",
    category: "Storage"
  },
  {
    id: "8",
    name: "Webcam HD",
    price: 2999,
    image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop",
    category: "Accessories"
  }
]

export const orders: Order[] = [
  {
    id: "LT2033",
    customer: "Rahul Sharma",
    status: "delivered",
    amount: 4999,
    date: "2026-05-25"
  },
  {
    id: "LT2034",
    customer: "Aditya Kumar",
    status: "shipped",
    amount: 7999,
    date: "2026-05-25"
  },
  {
    id: "LT2035",
    customer: "Sneha Pillai",
    status: "pending",
    amount: 2499,
    date: "2026-05-24"
  },
  {
    id: "LT2036",
    customer: "Priya Nair",
    status: "pending",
    amount: 6499,
    date: "2026-05-24"
  },
  {
    id: "LT2037",
    customer: "Vikram Singh",
    status: "delivered",
    amount: 3499,
    date: "2026-05-23"
  },
  {
    id: "LT2038",
    customer: "Meera Reddy",
    status: "shipped",
    amount: 1999,
    date: "2026-05-23"
  },
  {
    id: "LT2039",
    customer: "Arjun Menon",
    status: "delivered",
    amount: 5499,
    date: "2026-05-22"
  },
  {
    id: "LT2040",
    customer: "Kavitha Iyer",
    status: "pending",
    amount: 2999,
    date: "2026-05-22"
  }
]

export const trackingSteps: TrackingStep[] = [
  {
    id: "1",
    title: "Chennai Warehouse",
    description: "Package departed from hub",
    status: "completed",
    timestamp: "10:30 AM"
  },
  {
    id: "2",
    title: "Out For Delivery",
    description: "Delivery partner in vicinity",
    status: "in-progress",
    timestamp: "2:15 PM"
  },
  {
    id: "3",
    title: "Expected Delivery",
    description: "Today by 6:00 PM",
    status: "pending"
  }
]

export const customerStats = {
  totalOrders: 1284,
  items: 32,
  pending: 934,
  revenue: 84500
}

export const deliveryRoute = {
  origin: { lat: 13.0827, lng: 80.2707, name: "Chennai Warehouse" },
  destination: { lat: 13.0569, lng: 80.2425, name: "Customer Location" },
  currentPosition: { lat: 13.0650, lng: 80.2550 },
  waypoints: [
    { lat: 13.0827, lng: 80.2707 },
    { lat: 13.0750, lng: 80.2650 },
    { lat: 13.0700, lng: 80.2580 },
    { lat: 13.0650, lng: 80.2550 },
    { lat: 13.0600, lng: 80.2480 },
    { lat: 13.0569, lng: 80.2425 }
  ]
}
