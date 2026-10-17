export interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: number;
  status: string;
  image: string;
}

export interface InventoryItem {
  id: number;
  product: string;
  sku: string;
  stock: number;
  status: string;
}

export interface Agent {
  id: number;
  name: string;
  deliveries: number;
  status: string;
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
  payment: string;
}

const PRODUCTS_KEY = "logitrack_products";
const INVENTORY_KEY = "logitrack_inventory";
const AGENTS_KEY = "logitrack_agents";

const defaultProducts: Product[] = [
  {
    id: 1,
    name: "Wireless Scanner",
    sku: "SKU-1001",
    price: "₹120",
    stock: 12,
    status: "In Stock",
    image: "https://images.unsplash.com/photo-1580894908361-967195033215",
  },
  {
    id: 2,
    name: "Packaging Box",
    sku: "SKU-1002",
    price: "₹40",
    stock: 4,
    status: "Low Stock",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
  },
  {
    id: 3,
    name: "Delivery Label Printer",
    sku: "SKU-1003",
    price: "₹220",
    stock: 18,
    status: "In Stock",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
  },
];

const defaultInventory: InventoryItem[] = [
  {
    id: 1,
    product: "Wireless Scanner",
    sku: "INV-1001",
    stock: 12,
    status: "Healthy",
  },
  {
    id: 2,
    product: "Packaging Box",
    sku: "INV-1002",
    stock: 3,
    status: "Low Stock",
  },
  {
    id: 3,
    product: "Label Printer",
    sku: "INV-1003",
    stock: 18,
    status: "Healthy",
  },
];

const defaultAgents: Agent[] = [
  { id: 1, name: "Rahul Sharma", deliveries: 24, status: "Active" },
  { id: 2, name: "Vijay Kumar", deliveries: 18, status: "Active" },
  { id: 3, name: "Arjun", deliveries: 12, status: "Returning" },
];

const defaultOrders: Order[] = [
  {
    id: "#1001",
    customer: "Rahul Sharma",
    product: "Wireless Scanner",
    amount: "₹240",
    status: "Delivered",
    payment: "Paid",
  },
  {
    id: "#1002",
    customer: "Arjun Kumar",
    product: "Tracking Device",
    amount: "₹120",
    status: "Processing",
    payment: "Pending",
  },
  {
    id: "#1003",
    customer: "Priya Nair",
    product: "Packaging Box",
    amount: "₹80",
    status: "Out for Delivery",
    payment: "Paid",
  },
];

function safeParse<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  const value = window.localStorage.getItem(key);
  if (!value) return defaultValue;

  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

export function getProducts(): Product[] {
  return safeParse<Product[]>(PRODUCTS_KEY, defaultProducts);
}

export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getInventory(): InventoryItem[] {
  return safeParse<InventoryItem[]>(INVENTORY_KEY, defaultInventory);
}

export function saveInventory(inventory: InventoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

export function getAgents(): Agent[] {
  return safeParse<Agent[]>(AGENTS_KEY, defaultAgents);
}

export function saveAgents(agents: Agent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
}

export function getOrders(): Order[] {
  return defaultOrders;
}

export function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((item) => item.id)) + 1;
}
