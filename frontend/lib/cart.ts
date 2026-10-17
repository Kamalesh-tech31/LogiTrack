export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

const CART_STORAGE_KEY = "customerCart";

function getCartStorageKey() {
  if (typeof window === "undefined") {
    return CART_STORAGE_KEY;
  }

  const userId = window.localStorage.getItem("userId");
  return userId ? `${CART_STORAGE_KEY}:${userId}` : CART_STORAGE_KEY;
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(getCartStorageKey());
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
}

export function clearCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getCartStorageKey());
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function addToCart(product: Omit<CartItem, "quantity">) {
  const existingCart = loadCart();
  const existingItem = existingCart.find((item) => item.id === product.id);

  const updatedCart = existingCart.map((item) =>
    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
  );

  if (!existingItem) {
    updatedCart.push({ ...product, quantity: 1 });
  }

  saveCart(updatedCart);
  return updatedCart;
}

export function updateCartQuantity(id: string, quantity: number) {
  const cart = loadCart();
  const updated = cart
    .map((item) => (item.id === id ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  saveCart(updated);
  return updated;
}

export function removeFromCart(id: string) {
  const cart = loadCart();
  const updated = cart.filter((item) => item.id !== id);
  saveCart(updated);
  return updated;
}
