const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 24;
const DEFAULT_QUERY = "agriculture farm";
const UTM = "utm_source=agritrace&utm_medium=referral";

function getUnsplashAccessKey() {
  const key = String(process.env.UNSPLASH_ACCESS_KEY || "").trim();
  if (!key) {
    const err = new Error("UNSPLASH_ACCESS_KEY is not configured");
    err.status = 503;
    throw err;
  }
  return key;
}

function cleanQuery(value) {
  const query = String(value || DEFAULT_QUERY).trim().slice(0, 80);
  return query || DEFAULT_QUERY;
}

function addUtm(url) {
  if (!url) return "";
  return `${url}${url.includes("?") ? "&" : "?"}${UTM}`;
}

function toApiPhoto(photo) {
  return {
    id: photo.id,
    alt: photo.alt_description || photo.description || "Unsplash photo",
    color: photo.color || "",
    width: photo.width,
    height: photo.height,
    url: photo.urls?.regular || photo.urls?.small || "",
    thumb: photo.urls?.small || photo.urls?.thumb || "",
    downloadLocation: photo.links?.download_location || "",
    unsplashUrl: addUtm(photo.links?.html),
    photographer: photo.user?.name || "Unsplash photographer",
    photographerUrl: addUtm(photo.user?.links?.html),
  };
}

function buildUnsplashHeaders() {
  return {
    Authorization: `Client-ID ${getUnsplashAccessKey()}`,
    "Accept-Version": "v1",
  };
}

async function searchUnsplashPhotos(req, res, next) {
  try {
    const query = cleanQuery(req.query.query);
    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(1, Number.parseInt(req.query.perPage || String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE)
    );
    const orientation = req.query.orientation || "landscape";
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(perPage),
      orientation,
      content_filter: "high",
    });

    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: buildUnsplashHeaders(),
    });

    if (!response.ok) {
      const message = await response.text();
      const err = new Error(message || "Unsplash search failed");
      err.status = response.status;
      throw err;
    }

    const payload = await response.json();
    res.json({
      success: true,
      data: {
        query,
        page,
        total: payload.total || 0,
        totalPages: payload.total_pages || 0,
        photos: (payload.results || []).map(toApiPhoto),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function trackUnsplashDownload(req, res, next) {
  try {
    const photoId = String(req.body.photoId || "").trim();
    const downloadLocation = String(req.body.downloadLocation || "").trim();
    let endpoint = "";

    if (downloadLocation) {
      const parsed = new URL(downloadLocation);
      if (
        parsed.hostname !== "api.unsplash.com" ||
        !parsed.pathname.startsWith("/photos/") ||
        !parsed.pathname.endsWith("/download")
      ) {
        const err = new Error("downloadLocation không hợp lệ");
        err.status = 400;
        throw err;
      }
      endpoint = parsed.toString();
    } else if (photoId) {
      endpoint = `https://api.unsplash.com/photos/${encodeURIComponent(photoId)}/download`;
    } else {
      const err = new Error("photoId hoặc downloadLocation là bắt buộc");
      err.status = 400;
      throw err;
    }

    const response = await fetch(endpoint, {
      headers: buildUnsplashHeaders(),
    });

    if (!response.ok) {
      const message = await response.text();
      const err = new Error(message || "Unsplash download tracking failed");
      err.status = response.status;
      throw err;
    }

    const payload = await response.json().catch(() => ({}));
    res.json({
      success: true,
      data: {
        tracked: true,
        url: payload.url || "",
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchUnsplashPhotos,
  trackUnsplashDownload,
};
