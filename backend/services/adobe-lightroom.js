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
        "⚠️  Adobe API credentials not found in environment variables."
      );
      console.warn(
        "   Make sure ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET are set in .env file"
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
          `  → Access token: ${this.accessToken ? "loaded" : "missing"}`
        );
        console.log(
          `  → Refresh token: ${this.refreshToken ? "loaded" : "missing"}`
        );
        console.log(`  → Token expires: ${this.tokenExpiresAt || "unknown"}`);

        // Check if token is expired
        if (this.tokenExpiresAt && new Date() > new Date(this.tokenExpiresAt)) {
          console.log(
            "  ⚠️  Adobe token expired, will refresh on next request"
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
        "ADOBE_CLIENT_ID is not configured. Please set it in your .env file."
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
      this.clientId ? `${this.clientId.substring(0, 8)}...` : "MISSING"
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
              this.saveTokens(
                response.access_token,
                response.refresh_token,
                response.expires_in
              );
              resolve(response);
            }
          } catch (error) {
            reject(
              new Error(`Failed to parse token response: ${error.message}`)
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
                response.expires_in
              );
              resolve(response);
            }
          } catch (error) {
            reject(
              new Error(`Failed to parse token response: ${error.message}`)
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
    // Try to refresh token if expired
    if (!this.accessToken && this.refreshToken) {
      try {
        await this.refreshAccessToken(this.refreshToken);
      } catch (error) {
        console.error("Failed to refresh token:", error);
        throw new Error(
          "No access token available. Please re-authenticate at /auth/adobe"
        );
      }
    }

    if (!this.accessToken) {
      throw new Error(
        "No access token available. Please authenticate at /auth/adobe"
      );
    }

    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, ADOBE_API_BASE);

      const requestOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: options.method || "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-API-Key": this.clientId,
          ...options.headers,
        },
      };

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
                new Error("Authentication expired. Please re-authenticate.")
              );
            }
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              console.log(
                `  → Response data preview:`,
                JSON.stringify(parsed).substring(0, 200)
              );
              resolve(parsed);
            } catch (error) {
              console.log(`  → Non-JSON response:`, data.substring(0, 200));
              resolve(data);
            }
          } else {
            console.error(
              `  ❌ API Error ${res.statusCode}:`,
              data.substring(0, 500)
            );
            reject(
              new Error(`API request failed: ${res.statusCode} - ${data}`)
            );
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
      console.log("  → Making request to /catalog endpoint...");
      const response = await this.makeRequest("/catalog");
      console.log("  → Catalog API response received");
      return response;
    } catch (error) {
      console.error("  ❌ Error fetching catalogs:", error.message);
      throw error;
    }
  }

  /**
   * Get assets (photos) from a catalog
   */
  async getAssets(catalogId, options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 100,
        ...(options.offset && { offset: options.offset }),
      });

      return await this.makeRequest(
        `/catalog/${catalogId}/assets?${params.toString()}`
      );
    } catch (error) {
      console.error("Error fetching assets:", error);
      throw error;
    }
  }

  /**
   * Get all photos from Lightroom
   * This is a convenience method that fetches from the default catalog
   */
  async getPhotos(options = {}) {
    try {
      console.log("📸 Fetching photos from Adobe Lightroom...");

      // Get the first catalog (or you can specify a catalog ID)
      console.log("  → Fetching catalogs...");
      const catalogs = await this.getCatalogs();
      console.log(
        "  → Catalogs response:",
        JSON.stringify(catalogs, null, 2).substring(0, 500)
      );

      if (!catalogs || !catalogs.resources || catalogs.resources.length === 0) {
        console.warn("  ⚠️  No catalogs found in Adobe Lightroom account");
        return [];
      }

      // Use the first catalog
      const catalogId = catalogs.resources[0].id;
      console.log(`  → Using catalog ID: ${catalogId}`);

      // Get assets from the catalog
      console.log("  → Fetching assets from catalog...");
      const assets = await this.getAssets(catalogId, options);
      console.log(
        "  → Assets response:",
        JSON.stringify(assets, null, 2).substring(0, 500)
      );

      // Transform Adobe Lightroom assets to our Photo format
      if (assets && assets.resources) {
        console.log(`  → Found ${assets.resources.length} assets`);
        const photos = assets.resources.map((asset, index) => {
          // Get the best available rendition URL
          const rendition =
            asset.renditions?.find((r) => r.type === "fullsize") ||
            asset.renditions?.[0] ||
            {};

          const photo = {
            id: asset.id || `adobe-${index + 1}`,
            title: asset.caption || asset.filename || `Photo ${index + 1}`,
            url: rendition.href || asset.href || "",
            price: options.defaultPrice || 10, // Default price, can be customized
            // Additional metadata from Adobe
            metadata: {
              filename: asset.filename,
              created: asset.created,
              updated: asset.updated,
              catalogId: catalogId,
            },
          };

          console.log(
            `  → Photo ${index + 1}: ${photo.title} - URL: ${photo.url ? "present" : "MISSING"}`
          );
          return photo;
        });

        console.log(`✅ Successfully transformed ${photos.length} photos`);
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
      `  → isConnected() check: ${connected} (accessToken: ${!!this.accessToken}, refreshToken: ${!!this.refreshToken})`
    );
    return connected;
  }
}

module.exports = new AdobeLightroomService();
