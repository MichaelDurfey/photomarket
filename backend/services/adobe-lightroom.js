/**
 * Adobe Lightroom API Service
 *
 * This service handles authentication and fetching photos from Adobe Lightroom API.
 *
 * Setup Instructions:
 * 1. Register your app at https://developer.adobe.com/console
 * 2. Create a new project and add "Lightroom API" service
 * 3. Get your Client ID and Client Secret
 * 4. Set up OAuth redirect URI (e.g., http://localhost:3000/auth/adobe/callback)
 * 5. Add credentials to .env file:
 *    - ADOBE_CLIENT_ID=your_client_id
 *    - ADOBE_CLIENT_SECRET=your_client_secret
 *    - ADOBE_REDIRECT_URI=http://localhost:3000/auth/adobe/callback
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ADOBE_AUTH_URL = "https://ims-na1.adobelogin.com";
const ADOBE_API_BASE = "https://lr.adobe.io/v2";
const TOKENS_FILE = path.join(__dirname, "../adobe-tokens.json");

const ensureTrailingSlash = (value) =>
  value.endsWith("/") ? value : `${value}/`;

function resolveApiUrl(endpoint) {
  if (!endpoint) {
    return new URL(ensureTrailingSlash(ADOBE_API_BASE));
  }

  if (/^https?:\/\//i.test(endpoint)) {
    return new URL(endpoint);
  }

  const base = ensureTrailingSlash(ADOBE_API_BASE);
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  return new URL(normalizedEndpoint, base);
}

class AdobeLightroomService {
  constructor() {
    // Reload environment variables to ensure they're available
    // (in case dotenv.config() is called after this module is loaded)
    if (typeof require !== "undefined") {
      try {
        require("dotenv").config();
      } catch (e) {
        // dotenv might already be loaded, that's fine
      }
    }

    this.clientId = process.env.ADOBE_CLIENT_ID;
    this.clientSecret = process.env.ADOBE_CLIENT_SECRET;
    this.redirectUri =
      process.env.ADOBE_REDIRECT_URI ||
      "http://localhost:3000/auth/adobe/callback";
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;

    // Debug: Log if credentials are missing
    if (!this.clientId || !this.clientSecret) {
      console.warn(
        "⚠️  Adobe API credentials not found in environment variables.",
      );
      console.warn(
        "   Make sure ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET are set in .env file",
      );
    }

    // Load stored tokens on initialization
    this.loadTokens();
  }

  /**
   * Load tokens from file
   */
  loadTokens() {
    try {
      if (fs.existsSync(TOKENS_FILE)) {
        console.log("📂 Loading Adobe tokens from file...");
        const tokensData = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
        this.accessToken = tokensData.accessToken;
        this.refreshToken = tokensData.refreshToken;
        this.tokenExpiresAt = tokensData.tokenExpiresAt;

        console.log(
          `  → Access token: ${this.accessToken ? "loaded" : "missing"}`,
        );
        console.log(
          `  → Refresh token: ${this.refreshToken ? "loaded" : "missing"}`,
        );
        console.log(`  → Token expires: ${this.tokenExpiresAt || "unknown"}`);

        // Check if token is expired
        if (this.tokenExpiresAt && new Date() > new Date(this.tokenExpiresAt)) {
          console.log(
            "  ⚠️  Adobe token expired, will refresh on next request",
          );
          this.accessToken = null; // Force refresh
        } else if (this.accessToken) {
          console.log("  ✅ Adobe tokens loaded successfully");
        }
      } else {
        console.log("  ℹ️  No Adobe tokens file found - account not connected");
      }
    } catch (error) {
      console.warn("  ⚠️  Could not load Adobe tokens:", error.message);
    }
  }

  /**
   * Save tokens to file
   */
  saveTokens(accessToken, refreshToken, expiresIn) {
    try {
      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

      const tokensData = {
        accessToken,
        refreshToken,
        tokenExpiresAt,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokensData, null, 2));
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiresAt = tokenExpiresAt;

      console.log("Adobe tokens saved successfully");
    } catch (error) {
      console.error("Error saving Adobe tokens:", error);
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state = null) {
    if (!this.clientId) {
      throw new Error(
        "ADOBE_CLIENT_ID is not configured. Please set it in your .env file.",
      );
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "lr_partner_apis,openid,AdobeID",
      state: state || Math.random().toString(36).substring(7),
    });

    return `${ADOBE_AUTH_URL}/ims/authorize/v2?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    // Re-check environment variables in case they weren't loaded initially
    if (!this.clientId) {
      this.clientId = process.env.ADOBE_CLIENT_ID;
    }
    if (!this.clientSecret) {
      this.clientSecret = process.env.ADOBE_CLIENT_SECRET;
    }

    // Validate that credentials are set
    if (!this.clientId || !this.clientSecret) {
      const errorMsg = `Adobe API credentials not configured. 
        clientId: ${this.clientId ? "set" : "MISSING"}
        clientSecret: ${this.clientSecret ? "set" : "MISSING"}
        Please set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET in your .env file.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!code) {
      throw new Error("Authorization code is required");
    }

    console.log("Exchanging authorization code for token...");
    console.log(
      "Client ID:",
      this.clientId ? `${this.clientId.substring(0, 8)}...` : "MISSING",
    );

    return new Promise((resolve, reject) => {
      // Adobe API expects form-encoded data, not JSON
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
      });

      const postData = params.toString();

      const options = {
        hostname: "ims-na1.adobelogin.com",
        path: "/ims/token/v3",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else {
              // Save tokens to file for persistence
              const refreshToken = response.refresh_token || null;
              if (!refreshToken) {
                console.warn(
                  "  ⚠️  No refresh_token in response - tokens will expire after 24 hours",
                );
              }
              this.saveTokens(
                response.access_token,
                refreshToken,
                response.expires_in,
              );
              console.log("  ✅ Tokens saved:", {
                accessToken: "saved",
                refreshToken: refreshToken ? "saved" : "MISSING",
                expiresIn: response.expires_in
                  ? `${response.expires_in}s`
                  : "unknown",
              });
              resolve(response);
            }
          } catch (error) {
            reject(
              new Error(`Failed to parse token response: ${error.message}`),
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    return new Promise((resolve, reject) => {
      // Adobe API expects form-encoded data, not JSON
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });

      const postData = params.toString();

      const options = {
        hostname: "ims-na1.adobelogin.com",
        path: "/ims/token/v3",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else {
              // Save refreshed tokens to file
              this.saveTokens(
                response.access_token,
                response.refresh_token || this.refreshToken,
                response.expires_in,
              );
              resolve(response);
            }
          } catch (error) {
            reject(
              new Error(`Failed to parse token response: ${error.message}`),
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Make authenticated API request to Adobe Lightroom
   */
  async makeRequest(endpoint, options = {}) {
    // Check if access token is expired and refresh proactively
    if (this.accessToken && this.tokenExpiresAt) {
      const expiresAt = new Date(this.tokenExpiresAt);
      const now = new Date();
      // Refresh if token expires in less than 5 minutes
      if (
        now >= expiresAt ||
        expiresAt.getTime() - now.getTime() < 5 * 60 * 1000
      ) {
        console.log(
          "  ⚠️  Access token expired or expiring soon, refreshing...",
        );
        if (this.refreshToken) {
          try {
            await this.refreshAccessToken(this.refreshToken);
          } catch (error) {
            console.error("Failed to refresh token:", error);
            this.accessToken = null; // Clear expired token
          }
        } else {
          console.error("  ❌ No refresh token available - token expired");
          this.accessToken = null;
        }
      }
    }

    // Try to refresh token if missing
    if (!this.accessToken && this.refreshToken) {
      try {
        await this.refreshAccessToken(this.refreshToken);
      } catch (error) {
        console.error("Failed to refresh token:", error);
        throw new Error(
          "No access token available. Please re-authenticate at /auth/adobe",
        );
      }
    }

    if (!this.accessToken) {
      throw new Error(
        "No access token available. Please authenticate at /auth/adobe",
      );
    }

    return new Promise((resolve, reject) => {
      const url = resolveApiUrl(endpoint);

      const fullPath = url.pathname + url.search;
      const requestOptions = {
        hostname: url.hostname,
        path: fullPath,
        method: options.method || "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-API-Key": this.clientId,
          ...options.headers,
        },
      };

      console.log(
        `  → Making API request: ${requestOptions.method} https://${requestOptions.hostname}${requestOptions.path}`,
      );
      console.log(
        `  → Headers: Authorization: Bearer token, X-API-Key: ${this.clientId ? `${this.clientId.substring(0, 8)}...` : "MISSING"}`,
      );

      const protocol = url.protocol === "https:" ? https : http;
      const req = protocol.request(requestOptions, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          console.log(`  → API Response: ${res.statusCode} for ${endpoint}`);

          if (res.statusCode === 401) {
            console.log("  ⚠️  Unauthorized - token may be expired");
            // Token expired, try to refresh
            if (this.refreshToken) {
              console.log("  → Attempting to refresh token...");
              this.refreshAccessToken(this.refreshToken)
                .then(() => this.makeRequest(endpoint, options))
                .then(resolve)
                .catch(reject);
            } else {
              console.error("  ❌ No refresh token available");
              reject(
                new Error("Authentication expired. Please re-authenticate."),
              );
            }
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              // Adobe APIs sometimes prefix JSON with "while (1) {}" to prevent JSON hijacking.
              // Strip that so we can parse the actual JSON.
              const jsonStr = data
                .replace(/^\s*while\s*\(\s*1\s*\)\s*\{\s*\}\s*/i, "")
                .trim();
              const parsed = JSON.parse(jsonStr);
              console.log(`  → Response data preview:`, JSON.stringify(parsed));
              resolve(parsed);
            } catch (error) {
              console.log(`  → Non-JSON response:`, data.substring(0, 200));
              resolve(data);
            }
          } else {
            // Parse error response if possible (strip Adobe's while(1){} prefix if present)
            let errorMessage = `API request failed: ${res.statusCode}`;
            try {
              const jsonStr = data
                .replace(/^\s*while\s*\(\s*1\s*\)\s*\{\s*\}\s*/i, "")
                .trim();
              const errorData = JSON.parse(jsonStr);
              errorMessage =
                errorData.description ||
                errorData.message ||
                errorData.error ||
                errorMessage;
              if (errorData.errors) {
                errorMessage += ` - ${JSON.stringify(errorData.errors)}`;
              }
            } catch {
              errorMessage += ` - ${data.substring(0, 200)}`;
            }

            console.error(
              `  ❌ API Error ${res.statusCode} for ${endpoint}:`,
              errorMessage,
            );
            console.error(`  ❌ Full response:`, data.substring(0, 1000));

            // Special handling for 404 on /catalog
            if (res.statusCode === 404 && endpoint.includes("/catalog")) {
              errorMessage +=
                "\n\n💡 Common causes:\n" +
                "  - No cloud catalog exists (are you using Lightroom Classic instead of Lightroom cloud?)\n" +
                "  - Catalog hasn't been created yet (try logging into lightroom.adobe.com first)\n" +
                "  - User doesn't have an active Lightroom subscription";
            }

            reject(new Error(errorMessage));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /**
   * Get all catalogs (collections) from Lightroom
   */
  async getCatalogs() {
    try {
      const response = await this.makeRequest("/catalog");
      return response;
    } catch (error) {
      console.error("  ❌ Error fetching catalogs:", error.message);
      throw error;
    }
  }

  /**
   * Get albums (collections) in a catalog. Use the returned id with getPhotos({ albumId }) or getAssets(..., { albumId }).
   * @param {string} [catalogId] - If omitted, uses the default catalog from getCatalogs()
   * @returns {Promise<{ resources: Array<{ id: string, payload?: { name?: string }, ... }> }>}
   */
  async getAlbums(catalogId) {
    try {
      const cid = catalogId || (await this.getCatalogs())?.id;
      if (!cid) throw new Error("No catalog available");
      return await this.makeRequest(`/catalogs/${cid}/albums`);
    } catch (error) {
      console.error("Error fetching albums:", error);
      throw error;
    }
  }

  /**
   * Get assets (photos) from a catalog or from a specific album.
   * @param {string} catalogId
   * @param {object} [options]
   * @param {number} [options.limit=100]
   * @param {string} [options.offset] - Pagination offset
   * @param {string} [options.subtype] - Filter by asset subtype (e.g. "image" for photos only)
   * @param {string} [options.albumId] - If set, returns only assets in this album (uses albums/{id}/assets endpoint)
   */
  async getAssets(catalogId, options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 100,
        ...(options.offset && { offset: options.offset }),
        ...(options.subtype && { subtype: options.subtype }),
      });

      const path = options.albumId
        ? `/catalogs/${catalogId}/albums/${options.albumId}/assets?${params.toString()}`
        : `/catalogs/${catalogId}/assets?${params.toString()}`;

      return await this.makeRequest(path);
    } catch (error) {
      console.error("Error fetching assets:", error);
      throw error;
    }
  }

  /**
   * Fetch a single rendition (image bytes) for use behind a proxy. Call with the
   * backend's OAuth token so <img src="..."> can use the proxy URL without exposing the token.
   * @param {string} catalogId
   * @param {string} assetId
   * @param {string} [type='2048'] - Rendition type: thumbnail2x, 640, 1280, 2048 (standard), or fullsize/2560 (on-demand)
   * @returns {Promise<{ buffer: Buffer, contentType: string }>}
   */
  async getRendition(catalogId, assetId, type = "2048") {
    if (!this.accessToken && this.refreshToken) {
      await this.refreshAccessToken(this.refreshToken);
    }
    if (!this.accessToken) {
      throw new Error(
        "No access token available. Please re-authenticate at /auth/adobe",
      );
    }

    const endpoint = `/catalogs/${catalogId}/assets/${assetId}/renditions/${type}`;
    const url = resolveApiUrl(endpoint);
    const protocol = url.protocol === "https:" ? https : http;

    return new Promise((resolve, reject) => {
      const req = protocol.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-API-Key": this.clientId,
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            if (res.statusCode === 401 && this.refreshToken) {
              this.refreshAccessToken(this.refreshToken)
                .then(() => this.getRendition(catalogId, assetId, type))
                .then(resolve)
                .catch(reject);
              return;
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(
                new Error(
                  `Rendition request failed: ${res.statusCode} ${res.statusMessage}`,
                ),
              );
              return;
            }
            const contentType = res.headers["content-type"] || "image/jpeg";
            resolve({
              buffer: Buffer.concat(chunks),
              contentType,
            });
          });
        },
      );
      req.on("error", reject);
      req.end();
    });
  }

  /**
   * Get all photos from Lightroom
   * This is a convenience method that fetches from the default catalog.
   * @param {object} [options]
   * @param {number} [options.limit=100]
   * @param {string} [options.offset]
   * @param {string} [options.subtype] - e.g. "image" to restrict to photo assets
   * @param {string} [options.albumId] - only photos in this album
   * @param {string} [options.albumName] - only photos in the album with this name (e.g. "Europe 2025"). Resolved to albumId automatically.
   * @param {number} [options.minRating] - filter to photos with at least this star rating (1-5). Applied client-side after fetch; rating is in asset.payload.userRating (or .rating).
   */
  async getPhotos(options = {}) {
    try {
      console.log("📸 Fetching photos from Adobe Lightroom...");

      // Get the first catalog (or you can specify a catalog ID)
      console.log("  → Fetching catalogs...");
      const catalogs = await this.getCatalogs();

      if (!catalogs || !catalogs.id) {
        console.warn("  ⚠️  No catalogs found in Adobe Lightroom account");
        return [];
      }

      const catalogId = catalogs.id;
      console.log(`  → Using catalog ID: ${catalogId}`);

      // Resolve album name to id if requested (e.g. "Europe 2025")
      let albumId = options.albumId;
      if (!albumId && options.albumName) {
        const albumsResponse = await this.getAlbums(catalogId);
        const name = String(options.albumName).trim().toLowerCase();
        const album = albumsResponse?.resources?.find(
          (a) => (a.payload?.name || "").trim().toLowerCase() === name,
        );
        if (album) {
          albumId = album.id;
          console.log(
            `  → Resolved album "${options.albumName}" to id: ${albumId}`,
          );
        } else {
          console.warn(`  ⚠️  No album found with name "${options.albumName}"`);
        }
      }
      const fetchOptions = { ...options, albumId };

      // Get assets from the catalog (or from a specific album if albumId is set)
      console.log("  → Fetching assets from catalog...");
      let assets = await this.getAssets(catalogId, fetchOptions);

      // Optional client-side filter by star rating (API does not support server-side rating filter)
      const minRating =
        options.minRating != null ? Number(options.minRating) : null;
      if (minRating != null && assets?.resources?.length) {
        const ratingValue = (asset) =>
          asset.payload?.userRating ?? asset.payload?.rating ?? 0;
        assets = {
          ...assets,
          resources: assets.resources.filter(
            (a) => ratingValue(a) >= minRating,
          ),
        };
        console.log(
          `  → Filtered to ${assets.resources.length} assets with rating >= ${minRating} stars`,
        );
      }

      // Transform Adobe Lightroom assets to our Photo format
      // Per API docs (read_generate_renditions): assets expose rendition links in "links", not a top-level
      // "renditions" array. Standard types (thumbnail2x, 640, 1280, 2048) exist for all photos; fullsize/2560
      // are on-demand. Image is retrieved via GET {base}assets/{asset_id}/renditions/{type} (returns bytes).
      if (assets && assets.resources) {
        console.log(`  → Found ${assets.resources.length} assets`);
        const RENDITION_TYPE = "2048";
        const photos = assets.resources.map((asset, index) => {
          // Use our backend proxy URL so <img src="..."> works without sending the OAuth token to the browser.
          // The proxy (GET /api/adobe/rendition/:catalogId/:assetId) adds the token when fetching from Adobe.
          const proxyPath = asset.id
            ? `/api/adobe/rendition/${catalogId}/${asset.id}?type=${RENDITION_TYPE}`
            : "";

          const photo = {
            id: asset.id || `adobe-${index + 1}`,
            title: asset.caption || asset.filename || `Photo ${index + 1}`,
            url: proxyPath,
            price: options.defaultPrice || 10, // Default price, can be customized
            // Additional metadata from Adobe
            metadata: {
              filename: asset.filename,
              created: asset.created,
              updated: asset.updated,
              catalogId: catalogId,
            },
          };

          return photo;
        });
        return photos;
      }

      console.warn("  ⚠️  No assets found in catalog response");
      return [];
    } catch (error) {
      console.error("❌ Error fetching photos from Lightroom:", error);
      console.error("   Error details:", error.message);
      if (error.stack) {
        console.error("   Stack:", error.stack.substring(0, 500));
      }
      // Return empty array on error to prevent app crash
      return [];
    }
  }

  /**
   * Set access token (useful for storing tokens in database)
   */
  setAccessToken(token, refreshToken = null, expiresIn = null) {
    this.saveTokens(token, refreshToken, expiresIn);
  }

  /**
   * Clear stored tokens (for disconnecting)
   */
  clearTokens() {
    try {
      if (fs.existsSync(TOKENS_FILE)) {
        fs.unlinkSync(TOKENS_FILE);
      }
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiresAt = null;
      console.log("Adobe tokens cleared");
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  }

  /**
   * Check if account is connected
   */
  isConnected() {
    const connected = !!(this.accessToken || this.refreshToken);
    console.log(
      `  → isConnected() check: ${connected} (accessToken: ${!!this.accessToken}, refreshToken: ${!!this.refreshToken})`,
    );
    return connected;
  }
}

module.exports = new AdobeLightroomService();
