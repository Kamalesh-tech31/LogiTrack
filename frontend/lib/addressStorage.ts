export interface SavedAddress {
  id: string;
  label: string; // "Home" | "Work" | "Friend" | "Custom"
  fullName: string;
  phone: string;
  doorNo: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  country?: string;
  createdAt?: string;
}

export function buildFullAddress(data: {
  doorNo?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}): string {
  const parts: string[] = [];
  if (data.doorNo?.trim()) parts.push(data.doorNo.trim());
  if (data.street?.trim()) parts.push(data.street.trim());
  if (data.area?.trim()) parts.push(data.area.trim());
  if (data.city?.trim()) parts.push(data.city.trim());
  if (data.state?.trim()) parts.push(data.state.trim());
  if (data.postalCode?.trim()) parts.push(data.postalCode.trim());

  return parts.filter(Boolean).join(", ");
}

export function parseAddressString(fullAddress: string): {
  doorNo: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
} {
  if (!fullAddress || typeof fullAddress !== "string") {
    return {
      doorNo: "",
      street: "",
      area: "",
      city: "",
      state: "",
      postalCode: "",
    };
  }

  let cleaned = fullAddress.trim();
  let pin = "";
  const pinMatch = cleaned.match(/\b\d{6}\b/);
  if (pinMatch) {
    pin = pinMatch[0];
    cleaned = cleaned.replace(/[-–, ]*\b\d{6}\b/, "");
  }

  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      doorNo: "",
      street: "",
      area: "",
      city: "",
      state: "",
      postalCode: pin,
    };
  }

  if (parts.length === 1) {
    return {
      doorNo: "",
      street: parts[0],
      area: "",
      city: "",
      state: "",
      postalCode: pin,
    };
  }

  if (parts.length === 2) {
    return {
      doorNo: parts[0],
      street: parts[1],
      area: "",
      city: "",
      state: "",
      postalCode: pin,
    };
  }

  if (parts.length === 3) {
    return {
      doorNo: parts[0],
      street: parts[1],
      area: "",
      city: parts[2],
      state: "",
      postalCode: pin,
    };
  }

  if (parts.length === 4) {
    return {
      doorNo: parts[0],
      street: parts[1],
      area: parts[2],
      city: parts[3],
      state: "",
      postalCode: pin,
    };
  }

  if (parts.length === 5) {
    return {
      doorNo: parts[0],
      street: parts[1],
      area: parts[2],
      city: parts[3],
      state: parts[4],
      postalCode: pin,
    };
  }

  // 6 or more parts: e.g. No.25/38, 18th Avenue, Banunagar, Pudur, Ambattur, Chennai, Tamil Nadu
  const doorNo = parts[0];
  const street = parts[1];
  const state = parts[parts.length - 1];
  const city = parts[parts.length - 2];
  const area = parts.slice(2, parts.length - 2).join(", ");

  return {
    doorNo,
    street,
    area,
    city,
    state,
    postalCode: pin,
  };
}

const STORAGE_KEY = "logitrack_saved_addresses";

export function getSavedAddresses(userId?: string | null): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => {
      const fullAddress = item.fullAddress || item.address || "";
      const fallbackParsed = fullAddress
        ? parseAddressString(fullAddress)
        : null;

      const doorNo = item.doorNo?.trim() || fallbackParsed?.doorNo || "";
      const street = item.street?.trim() || fallbackParsed?.street || "";
      const area = item.area?.trim() || fallbackParsed?.area || "";
      const city = item.city?.trim() || fallbackParsed?.city || "";
      const state = item.state?.trim() || fallbackParsed?.state || "";
      const postalCode =
        item.postalCode?.trim() || fallbackParsed?.postalCode || "";

      const compiled =
        item.fullAddress ||
        buildFullAddress({ doorNo, street, area, city, state, postalCode });

      return {
        id: item.id || `addr_${Date.now()}`,
        label: item.label || "Home",
        fullName: item.fullName || "",
        phone: item.phone || "",
        doorNo,
        street,
        area,
        city,
        state,
        postalCode,
        fullAddress: compiled,
        latitude: Number(item.latitude) || 13.0827,
        longitude: Number(item.longitude) || 80.2707,
        country: item.country || "India",
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export function saveAddressItem(
  address: Omit<SavedAddress, "id" | "createdAt"> & { id?: string },
  userId?: string | null,
): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSavedAddresses(userId);
    const existingIndex = address.id
      ? current.findIndex((a) => a.id === address.id)
      : -1;

    const fullAddr =
      address.fullAddress?.trim() ||
      buildFullAddress({
        doorNo: address.doorNo,
        street: address.street,
        area: address.area,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      });

    const newItem: SavedAddress = {
      id:
        address.id ||
        `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: address.label?.trim() || "Home",
      fullName: address.fullName?.trim() || "",
      phone: address.phone?.trim() || "",
      doorNo: address.doorNo?.trim() || "",
      street: address.street?.trim() || "",
      area: address.area?.trim() || "",
      city: address.city?.trim() || "",
      state: address.state?.trim() || "",
      postalCode: address.postalCode?.trim() || "",
      fullAddress: fullAddr,
      latitude: Number(address.latitude) || 13.0827,
      longitude: Number(address.longitude) || 80.2707,
      country: address.country || "India",
      createdAt: new Date().toISOString(),
    };

    let updated: SavedAddress[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newItem;
    } else {
      updated = [newItem, ...current];
    }

    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteSavedAddress(
  id: string,
  userId?: string | null,
): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSavedAddresses(userId);
    const updated = current.filter((a) => a.id !== id);
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
