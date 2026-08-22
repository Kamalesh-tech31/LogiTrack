/**
 * Geocoding Service for LogiTrack
 * Integrates with Geoapify Geocoding API (https://api.geoapify.com/v1/geocode/search)
 * Secures the API key via process.env.GEOAPIFY_API_KEY.
 */

async function queryGeoapify(queryText, apiKey) {
  try {
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(queryText)}&apiKey=${apiKey.trim()}&format=json`;
    const response = await fetch(geoapifyUrl, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      const results = data?.results || [];
      if (results.length > 0) {
        const topResult = results[0];
        const lat = Number(topResult.lat);
        const lon = Number(topResult.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            latitude: lat,
            longitude: lon,
            formattedAddress: topResult.formatted || queryText,
            street: topResult.street || topResult.address_line1 || queryText,
            city: topResult.city || topResult.county || "",
            state: topResult.state || "",
            postalCode: topResult.postcode || "",
            country: topResult.country || "India",
          };
        }
      }
    }
  } catch (err) {
    console.error("[Geocoding] Geoapify fetch error:", err.message);
  }
  return null;
}

async function queryFallback(queryText) {
  try {
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(queryText)}`;
    const response = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "LogiTrack-Backend/1.0 (logistics-dispatch@logitrack.internal)",
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const topResult = data[0];
        const lat = Number(topResult.lat);
        const lon = Number(topResult.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          const addr = topResult.address || {};
          return {
            latitude: lat,
            longitude: lon,
            formattedAddress: topResult.display_name || queryText,
            street: [addr.road, addr.house_number].filter(Boolean).join(" ") || queryText,
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || "",
            postalCode: addr.postcode || "",
            country: addr.country || "India",
          };
        }
      }
    }
  } catch (err) {
    console.error("[Geocoding] Fallback fetch error:", err.message);
  }
  return null;
}

async function geocodeAddress(addressText) {
  if (!addressText || typeof addressText !== "string" || addressText.trim().length < 3) {
    return {
      success: false,
      message: "Please enter a valid, complete delivery address.",
    };
  }

  const cleanAddress = addressText.trim();
  const apiKey = process.env.GEOAPIFY_API_KEY;

  console.log(`[Geocoding] Geocoding address: "${cleanAddress}"`);

  // Prepare queries: full address first, then progressively simplified segments
  const queryCandidates = [cleanAddress];
  const parts = cleanAddress.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) {
    queryCandidates.push(parts.slice(1).join(", "));
  }
  if (parts.length > 3) {
    queryCandidates.push(parts.slice(2).join(", "));
  }
  if (parts.length >= 3) {
    queryCandidates.push(parts.slice(-3).join(", "));
  }

  // 1. Try Geoapify API if key configured
  if (apiKey && apiKey.trim().length > 0) {
    for (const query of queryCandidates) {
      const geoResult = await queryGeoapify(query, apiKey);
      if (geoResult) {
        console.log(`[Geocoding] Geoapify resolved coordinates: lat=${geoResult.latitude}, lon=${geoResult.longitude}`);
        return {
          success: true,
          source: "geoapify",
          data: {
            ...geoResult,
            fullAddress: cleanAddress,
          },
        };
      }
    }
  } else {
    console.log("[Geocoding] GEOAPIFY_API_KEY is not configured in environment. Using fallback provider.");
  }

  // 2. Try Fallback provider
  for (const query of queryCandidates) {
    const fallbackResult = await queryFallback(query);
    if (fallbackResult) {
      console.log(`[Geocoding] Fallback resolved coordinates: lat=${fallbackResult.latitude}, lon=${fallbackResult.longitude}`);
      return {
        success: true,
        source: "fallback",
        data: {
          ...fallbackResult,
          fullAddress: cleanAddress,
        },
      };
    }
  }

  return {
    success: false,
    message:
      "We could not determine the exact location for this address. Please provide a more complete address including house/door number, street/avenue, area, city, state, and PIN code.",
  };
}

/**
 * Address Suggestions / Autocomplete Service
 * Queries Geoapify Geocoding / Autocomplete API or OSM fallback.
 */
async function getAddressSuggestions(queryText) {
  if (!queryText || typeof queryText !== "string" || queryText.trim().length < 2) {
    return [];
  }

  const cleanText = queryText.trim();
  const apiKey = process.env.GEOAPIFY_API_KEY;

  // 1. Try Geoapify Autocomplete API
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(cleanText)}&apiKey=${apiKey.trim()}&format=json&limit=5`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (response.ok) {
        const data = await response.json();
        const results = data?.results || [];
        if (results.length > 0) {
          return results.map((r) => ({
            formatted: r.formatted || cleanText,
            addressLine1: r.address_line1 || r.street || "",
            addressLine2: r.address_line2 || [r.city, r.state, r.postcode].filter(Boolean).join(", "),
            street: r.street || r.address_line1 || "",
            city: r.city || r.county || "",
            state: r.state || "",
            postalCode: r.postcode || "",
            country: r.country || "India",
            latitude: Number(r.lat),
            longitude: Number(r.lon),
          }));
        }
      }
    } catch (err) {
      console.error("[Geocoding] Geoapify autocomplete error:", err.message);
    }
  }

  // 2. Try Fallback Nominatim search
  try {
    // If user query has door number, also search the area/street portion
    const parts = cleanText.split(",").map((p) => p.trim()).filter(Boolean);
    const searchQuery = parts.length > 2 ? parts.slice(1).join(", ") : cleanText;
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(searchQuery)}`;
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "LogiTrack-Backend/1.0 (logistics-dispatch@logitrack.internal)",
        Accept: "application/json",
      },
    });

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => {
          const addr = item.address || {};
          const street = [addr.road, addr.house_number].filter(Boolean).join(" ") || item.display_name.split(",")[0];
          const area = [addr.suburb, addr.neighbourhood, addr.city || addr.town || addr.village, addr.state, addr.postcode].filter(Boolean).join(", ");
          return {
            formatted: item.display_name,
            addressLine1: street,
            addressLine2: area,
            street,
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || "",
            postalCode: addr.postcode || "",
            country: addr.country || "India",
            latitude: Number(item.lat),
            longitude: Number(item.lon),
          };
        });
      }
    }
  } catch (err) {
    console.error("[Geocoding] Fallback autocomplete error:", err.message);
  }

  return [];
}

module.exports = {
  geocodeAddress,
  getAddressSuggestions,
};
