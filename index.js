// Enhanced Ko-fi to Discord webhook integration with multiple languages
import express from "express";
import { createServer } from "http";
import { Webhook, MessageBuilder } from "discord-webhook-node";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Get package version
let version = "unknown";
try {
  // Try to read package.json for version info
  const packagePath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    version = packageJson.version || "unknown";
  }
} catch (error) {
  console.error("Error reading package.json:", error.message);
}

// Load environment variables from multiple possible locations
function loadConfig() {
  // Possible locations for the .env file (in order of precedence)
  const configPaths = [
    path.join(process.cwd(), "/config/.env"), // /app/config/.env
    path.join(process.cwd(), "/app/config/.env"), // Another possible path
    path.join(process.cwd(), "/.env"), // Default .env in root
  ];

  console.log("Looking for config files in:");

  // Try each possible config path
  for (const configPath of configPaths) {
    console.log(`- ${configPath}`);
    if (fs.existsSync(configPath)) {
      console.log(`Config file found at: ${configPath}`);
      dotenv.config({ path: configPath });
      return configPath;
    }
  }

  // If no config files found, load from default location (which might not exist)
  console.log("No config file found, using environment variables only");
  dotenv.config();
  return null;
}

// Load environment configuration
const configPath = loadConfig();

// Environment variables with defaults
const PORT = process.env.PORT || 3033;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;
const LANGUAGE = process.env.LANGUAGE || "en"; // 'en' for English, 'de' for German
const KOFI_NAME = process.env.KOFI_NAME || "Ko-fi"; // Customizable Ko-fi name
const KOFI_LOGO =
  process.env.KOFI_LOGO ||
  "https://storage.ko-fi.com/cdn/brandasset/kofi_s_logo_nolabel.png";
const WEBHOOK_USERNAME =
  process.env.WEBHOOK_USERNAME || `${KOFI_NAME} Supporter Alert`;

// Log loaded configuration
console.log("===== Configuration =====");
console.log(`VERSION: ${version}`);
console.log(`PORT: ${PORT}`);
console.log(`LANGUAGE: ${LANGUAGE}`);
console.log(`KOFI_NAME: ${KOFI_NAME}`);
console.log(
  `WEBHOOK_URL: ${WEBHOOK_URL ? "Set (value hidden)" : "NOT SET - REQUIRED"}`
);
console.log(
  `VERIFICATION_TOKEN: ${
    VERIFICATION_TOKEN ? "Set (value hidden)" : "NOT SET - REQUIRED"
  }`
);
console.log("=========================");

// Validate required environment variables
if (!WEBHOOK_URL) {
  console.error("Error: DISCORD_WEBHOOK_URL environment variable is required");
  console.error(
    "Please set this variable in your environment or in a .env file in the /config folder"
  );
  process.exit(1);
}

// Translations for multiple languages
const translations = {
  en: {
    // Types
    Donation: "Donation",
    Subscription: "Subscription",
    Commission: "Commission",
    "Shop Order": "Shop Order",

    // Field names
    From: "From",
    Type: "Type",
    Amount: "Amount",
    "Membership Tier": "Membership Tier",
    "First Payment": "First Payment",
    Date: "Date",
    "Transaction ID": "Transaction ID",
    Message: "Message",

    // Status messages
    Yes: "Yes",
    Renewal: "Renewal",
    Anonymous: "Anonymous",

    // UI messages
    "New {KOFI_NAME} Support Received!": "New {KOFI_NAME} Support Received!",
    "has subscribed to the": "has subscribed to the",
    "tier!": "tier!",
    "Thanks for the support!": "Thanks for the support!",
    "{KOFI_NAME} Support": "{KOFI_NAME} Support",
  },
  de: {
    // Types
    Donation: "Spende",
    Subscription: "Abo",
    Commission: "Auftrag",
    "Shop Order": "Bestellung",

    // Field names
    From: "Von",
    Type: "Typ",
    Amount: "Betrag",
    "Membership Tier": "Mitgliedsstufe",
    "First Payment": "Erste Zahlung",
    Date: "Datum",
    "Transaction ID": "Transaktions-ID",
    Message: "Nachricht",

    // Status messages
    Yes: "Ja",
    Renewal: "Verlängerung",
    Anonymous: "Anonym",

    // UI messages
    "New {KOFI_NAME} Support Received!": "Neue {KOFI_NAME} Spende erhalten!",
    "has subscribed to the": "hat die",
    "tier!": "Stufe abonniert!",
    "Thanks for the support!": "Vielen Dank für die Unterstützung!",
    "{KOFI_NAME} Support": "{KOFI_NAME} Support",
  },
  fr: {
    // Types
    Donation: "Don",
    Subscription: "Abonnement",
    Commission: "Commission",
    "Shop Order": "Commande",

    // Field names
    From: "De",
    Type: "Type",
    Amount: "Montant",
    "Membership Tier": "Niveau d'adhésion",
    "First Payment": "Premier paiement",
    Date: "Date",
    "Transaction ID": "ID de transaction",
    Message: "Message",

    // Status messages
    Yes: "Oui",
    Renewal: "Renouvellement",
    Anonymous: "Anonyme",

    // UI messages
    "New {KOFI_NAME} Support Received!": "Nouveau soutien {KOFI_NAME} reçu !",
    "has subscribed to the": "a souscrit au niveau",
    "tier!": "!",
    "Thanks for the support!": "Merci pour le soutien !",
    "{KOFI_NAME} Support": "Support {KOFI_NAME}",
  },
};

// Function to get translation with variable replacement
function t(key) {
  const lang = LANGUAGE.toLowerCase();
  let text = "";

  if (translations[lang] && translations[lang][key]) {
    text = translations[lang][key];
  } else {
    // Fallback to English if translation not found
    text = translations.en[key] || key;
  }

  // Replace variables
  return text.replace(/{KOFI_NAME}/g, KOFI_NAME);
}

// Initialize Discord webhook
const webhook = new Webhook(WEBHOOK_URL);
webhook.setUsername(WEBHOOK_USERNAME);
webhook.setAvatar(KOFI_LOGO);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint - DEFINED FIRST to ensure it's not blocked by other routes
app.get("/", (req, res) => {
  console.log("Root endpoint accessed");
  res.status(200).json({
    message: `${KOFI_NAME} to Discord webhook service is online!`,
    version: version,
    language: LANGUAGE,
    kofiName: KOFI_NAME,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: `${KOFI_NAME} to Discord webhook service is running`,
    version: version,
    language: LANGUAGE,
    kofiName: KOFI_NAME,
  });
});

// Configuration info endpoint
app.get("/config", (req, res) => {
  res.status(200).json({
    version: version,
    configLoaded: configPath !== null,
    configPath: configPath,
    language: LANGUAGE,
    kofiName: KOFI_NAME,
    port: PORT,
    hasWebhookUrl: !!WEBHOOK_URL,
    hasVerificationToken: !!VERIFICATION_TOKEN,
  });
});

// Debug endpoint to test Discord webhook directly
app.get("/test-discord", async (req, res) => {
  try {
    console.log("Testing Discord webhook directly");

    const embed = new MessageBuilder()
      .setTitle(`${KOFI_NAME} Test Message`)
      .setDescription(
        `This is a test message from the webhook service v${version}`
      )
      .setColor(0x29abe0)
      .setTimestamp();

    await webhook.send(embed);
    console.log("Discord test message sent successfully");

    res
      .status(200)
      .json({ success: true, message: "Discord test message sent" });
  } catch (error) {
    console.error("Error sending Discord test message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Format timestamp nicely based on language
function formatDate(timestamp) {
  try {
    const date = new Date(timestamp);

    if (LANGUAGE.toLowerCase() === "de") {
      // German date format
      return date.toLocaleString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
      });
    } else if (LANGUAGE.toLowerCase() === "fr") {
      // French date format
      return date.toLocaleString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
      });
    } else {
      // Default English format
      return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
      });
    }
  } catch (e) {
    return timestamp || "Unknown date";
  }
}

// Get appropriate emoji for different transaction types
function getTypeEmoji(type) {
  switch (type?.toLowerCase()) {
    case "donation":
    case "spende":
    case "don":
      return "☕";
    case "subscription":
    case "abo":
    case "abonnement":
      return "🏆";
    case "commission":
    case "auftrag":
      return "🎨";
    case "shop order":
    case "bestellung":
    case "commande":
      return "🛍️";
    default:
      return "💖";
  }
}

// Get color based on transaction type or tier
function getColor(data) {
  // Ko-fi Blue: #29ABE0 = 2743264 in decimal
  // Different colors for different types or tiers
  if (data.tier_name) {
    switch (data.tier_name.toLowerCase()) {
      case "bronze":
        return 0xcd7f32; // Bronze color
      case "silver":
        return 0xc0c0c0; // Silver color
      case "gold":
        return 0xffd700; // Gold color
      case "platinum":
        return 0xe5e4e2; // Platinum color
      default:
        return 0x29abe0; // Ko-fi blue
    }
  }

  // Handle different language types
  const typeLC = data.type?.toLowerCase();
  if (typeLC === "donation" || typeLC === "spende" || typeLC === "don") {
    return 0x29abe0; // Ko-fi blue
  } else if (
    typeLC === "subscription" ||
    typeLC === "abo" ||
    typeLC === "abonnement"
  ) {
    return 0x8a2be2; // Purple
  } else if (typeLC === "commission" || typeLC === "auftrag") {
    return 0xff69b4; // Pink
  } else if (
    typeLC === "shop order" ||
    typeLC === "bestellung" ||
    typeLC === "commande"
  ) {
    return 0x32cd32; // Green
  } else {
    return 0x29abe0; // Ko-fi blue default
  }
}

// Ko-fi webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    console.log("Received webhook request:", JSON.stringify(req.body));

    // Extract and parse data from Ko-fi
    const { data } = req.body;

    if (!data) {
      console.error("No data provided in webhook request");
      return res
        .status(400)
        .json({ success: false, error: "No data provided" });
    }

    // Parse the Ko-fi data (Ko-fi sends data as a string that needs to be parsed)
    const kofiData = typeof data === "string" ? JSON.parse(data) : data;
    console.log("Parsed Ko-fi data:", JSON.stringify(kofiData));

    // Verify the token if configured
    if (
      VERIFICATION_TOKEN &&
      kofiData.verification_token !== VERIFICATION_TOKEN
    ) {
      console.warn("Invalid verification token received");
      return res
        .status(401)
        .json({ success: false, error: "Invalid verification token" });
    }

    // Log the transaction
    console.log(
      `New ${KOFI_NAME} transaction: ${
        kofiData.kofi_transaction_id || "Unknown ID"
      }`
    );
    console.log(
      `Type: ${kofiData.type || "Unknown type"}, Amount: ${
        kofiData.amount || "Unknown amount"
      }`
    );

    // Determine if it's a subscription
    const isSubscription =
      kofiData.type === "Subscription" ||
      kofiData.type === "Abo" ||
      kofiData.is_subscription_payment;

    // Get translated type
    const translatedType = t(kofiData.type || "Donation");

    // Create Discord embed message
    const embed = new MessageBuilder()
      .setTitle(
        `${getTypeEmoji(kofiData.type)} ${t(
          "New {KOFI_NAME} Support Received!"
        )}`
      )
      .setColor(getColor(kofiData))
      .setThumbnail(KOFI_LOGO);

    // Add message or default text to description
    if (kofiData.message && kofiData.message.trim()) {
      embed.setDescription(`"${kofiData.message}"`);
    } else if (isSubscription) {
      embed.setDescription(
        `**${kofiData.from_name || t("Anonymous")}** ${t(
          "has subscribed to the"
        )} ${kofiData.tier_name || ""} ${t("tier!")} 🎉`
      );
    } else {
      embed.setDescription(`${t("Thanks for the support!")} 💖`);
    }

    // Set URL and footer
    embed.setURL(kofiData.url || "https://ko-fi.com/");
    embed.setFooter(`${t("{KOFI_NAME} Support")} | v${version}`, KOFI_LOGO);
    embed.setTimestamp();

    // Add main fields
    embed.addField(t("From"), kofiData.from_name || t("Anonymous"), true);
    embed.addField(t("Type"), translatedType, true);

    // Amount with currency
    if (kofiData.amount) {
      embed.addField(
        t("Amount"),
        `${kofiData.amount} ${kofiData.currency || "USD"}`,
        true
      );
    }

    // Add subscription-specific fields
    if (isSubscription) {
      // Add tier name if available
      if (kofiData.tier_name) {
        embed.addField(t("Membership Tier"), kofiData.tier_name, true);
      }

      // Show if this is first payment
      if (kofiData.is_first_subscription_payment !== undefined) {
        embed.addField(
          t("First Payment"),
          kofiData.is_first_subscription_payment
            ? `${t("Yes")} ✨`
            : `${t("Renewal")} 🔄`,
          true
        );
      }
    }

    // Format and add timestamp
    if (kofiData.timestamp) {
      embed.addField(t("Date"), formatDate(kofiData.timestamp), false);
    }

    // Add transaction ID for reference
    if (kofiData.kofi_transaction_id) {
      embed.addField(t("Transaction ID"), kofiData.kofi_transaction_id, false);
    }

    // Add message as separate field if not used in description
    if (kofiData.message && kofiData.message.trim() && isSubscription) {
      embed.addField(t("Message"), kofiData.message, false);
    }

    // Send the webhook
    await webhook.send(embed);
    console.log("Discord webhook sent successfully");

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Handle 404s - MUST be after all other routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: "Not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Start the server
const server = createServer(app);
server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `${KOFI_NAME} to Discord webhook service v${version} listening on port ${PORT}`
  );
  console.log(`Server language: ${LANGUAGE}`);
  console.log(`Customized name: ${KOFI_NAME}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  console.log(`Root endpoint available at http://localhost:${PORT}/`);
  console.log(
    `Health check endpoint available at http://localhost:${PORT}/health`
  );
  console.log(
    `Config status: ${
      configPath ? "Loaded from " + configPath : "Using environment variables"
    }`
  );
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
