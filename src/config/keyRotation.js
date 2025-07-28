const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");

class KeyRotationService {
  constructor() {
    this.keysDir = path.join(process.cwd(), "keys");
    this.currentKeyFile = path.join(this.keysDir, "current-keys.json");
    this.keyHistory = new Map();
    this.currentKeys = null;
    this.keyRotationInterval = 24 * 60 * 60 * 1000; 
    this.keyExpiryTime = 7 * 24 * 60 * 60 * 1000; 
  }

  async initialize() {
    try {
      await fs.mkdir(this.keysDir, { recursive: true });

      await this.loadOrGenerateKeys();

    
      this.startKeyRotation();

      console.log("JWT Key Rotation Service initialized");
    } catch (error) {
      console.error("Failed to initialize Key Rotation Service:", error);
      throw error;
    }
  }

  async loadOrGenerateKeys() {
    try {
      const keysData = await fs.readFile(this.currentKeyFile, "utf8");
      const parsedKeys = JSON.parse(keysData);

      if (this.validateKeysStructure(parsedKeys)) {
        this.currentKeys = parsedKeys;
        this.loadKeyHistory();
        console.log(
          `📋 Loaded existing keys. Current version: ${this.currentKeys.version}`
        );
      } else {
        throw new Error("Invalid keys structure");
      }
    } catch (error) {
      console.log("Generating new JWT keys...");
      await this.generateNewKeys();
    }
  }

  validateKeysStructure(keys) {
    return (
      keys &&
      keys.version &&
      keys.accessSecret &&
      keys.refreshSecret &&
      keys.createdAt &&
      keys.expiresAt
    );
  }

  async generateNewKeys() {
    const version = this.generateKeyVersion();
    const accessSecret = this.generateSecureKey();
    const refreshSecret = this.generateSecureKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.keyExpiryTime);

    this.currentKeys = {
      version,
      accessSecret,
      refreshSecret,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.saveKeys();
    console.log(`Generated new keys with version: ${version}`);
  }

  generateKeyVersion() {
    return `v${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }

  generateSecureKey() {
    return crypto.randomBytes(64).toString("hex");
  }

  async saveKeys() {
    try {
      await fs.writeFile(
        this.currentKeyFile,
        JSON.stringify(this.currentKeys, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error("Failed to save keys:", error);
      throw error;
    }
  }

  loadKeyHistory() {
    // Store current keys in history for validation of old tokens
    if (this.currentKeys) {
      this.keyHistory.set(this.currentKeys.version, {
        accessSecret: this.currentKeys.accessSecret,
        refreshSecret: this.currentKeys.refreshSecret,
        expiresAt: new Date(this.currentKeys.expiresAt),
      });
    }
  }

  async rotateKeys() {
    try {
      console.log("🔄 Starting key rotation...");

      // Store current keys in history before rotation
      if (this.currentKeys) {
        this.keyHistory.set(this.currentKeys.version, {
          accessSecret: this.currentKeys.accessSecret,
          refreshSecret: this.currentKeys.refreshSecret,
          expiresAt: new Date(this.currentKeys.expiresAt),
        });
      }

      // Generate new keys
      await this.generateNewKeys();

      // Clean up expired keys from history
      this.cleanupExpiredKeys();

      console.log(
        `✅ Key rotation completed. New version: ${this.currentKeys.version}`
      );

      // Emit event for application to handle (e.g., notify monitoring systems)
      process.emit("keyRotated", {
        newVersion: this.currentKeys.version,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Key rotation failed:", error);
      throw error;
    }
  }

  cleanupExpiredKeys() {
    const now = new Date();
    const expiredVersions = [];

    for (const [version, keyData] of this.keyHistory.entries()) {
      if (keyData.expiresAt < now) {
        expiredVersions.push(version);
      }
    }

    expiredVersions.forEach((version) => {
      this.keyHistory.delete(version);
      console.log(`🗑️ Cleaned up expired key version: ${version}`);
    });
  }

  startKeyRotation() {
    setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        console.error("Scheduled key rotation failed:", error);
      }
    }, this.keyRotationInterval);

    console.log(
      `Key rotation scheduled every ${
        this.keyRotationInterval / (60 * 60 * 1000)
      } hours`
    );
  }

  getCurrentAccessSecret() {
    return this.currentKeys?.accessSecret || process.env.JWT_ACCESS_SECRET;
  }

  getCurrentRefreshSecret() {
    return this.currentKeys?.refreshSecret || process.env.JWT_REFRESH_SECRET;
  }

  getAccessSecretByVersion(version) {
    if (!version) return this.getCurrentAccessSecret();

    const keyData = this.keyHistory.get(version);
    return keyData?.accessSecret || this.getCurrentAccessSecret();
  }

  getRefreshSecretByVersion(version) {
    if (!version) return this.getCurrentRefreshSecret();

    const keyData = this.keyHistory.get(version);
    return keyData?.refreshSecret || this.getCurrentRefreshSecret();
  }

  getCurrentKeyVersion() {
    return this.currentKeys?.version;
  }

  isKeyVersionValid(version) {
    if (!version) return true; 

    return (
      this.keyHistory.has(version) || version === this.currentKeys?.version
    );
  }

  getKeyStats() {
    return {
      currentVersion: this.currentKeys?.version,
      currentKeyCreatedAt: this.currentKeys?.createdAt,
      currentKeyExpiresAt: this.currentKeys?.expiresAt,
      historicalVersionsCount: this.keyHistory.size,
      historicalVersions: Array.from(this.keyHistory.keys()),
    };
  }

  // Manual key rotation (for emergency situations)
  async forceKeyRotation() {
    console.log("Force key rotation initiated");
    await this.rotateKeys();
  }
}

const keyRotationService = new KeyRotationService();

module.exports = keyRotationService;
