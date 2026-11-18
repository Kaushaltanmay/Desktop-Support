/*
 * ============================================================================
 *  FLY MEDIA TECHNOLOGY — ESP32 + R307 BIOMETRIC ATTENDANCE TERMINAL
 * ============================================================================
 *  Hardware Wiring (ESP32 DevKit V1 / ESP32 Dev Module):
 *    - R307 Fingerprint Sensor:
 *        VCC -> VIN (5V) [Verify your R307 module voltage label]
 *        GND -> GND
 *        TX  -> GPIO 16 (RX2)
 *        RX  -> GPIO 17 (TX2)
 *    - 0.96" SSD1306 OLED Display (I2C, 128x64):
 *        VCC -> 3V3
 *        GND -> GND
 *        SCL -> GPIO 22
 *        SDA -> GPIO 21
 *    - 5mm RGB LED (Common Anode - Longest leg to 3V3, 220 ohm on R/G/B):
 *        Red   -> GPIO 26
 *        Green -> GPIO 25
 *        Blue  -> GPIO 33
 *    - Active Buzzer Module (3.3V-5V):
 *        VCC -> 3V3
 *        GND -> GND
 *        I/O -> GPIO 27
 *
 *  Required Arduino Libraries (Install via Library Manager):
 *    1. Adafruit Fingerprint Sensor Library
 *    2. Adafruit SSD1306
 *    3. Adafruit GFX Library
 *
 *  Serial Monitor Commands (115200 baud, Newline):
 *    ENROLL <slot>   -> Enroll a new fingerprint into slot 1..1000 (e.g. ENROLL 2)
 *    DELETE <slot>   -> Delete a fingerprint from slot 1..1000 (e.g. DELETE 2)
 *    CLEAR           -> Erase all fingerprints from sensor memory
 *    STATUS          -> Print Wi-Fi, sensor count, and offline queue status
 *    TEST            -> Ping backend server heartbeat immediately
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>
#include <Wire.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ===================== 1. USER CONFIGURATION =====================
// Replace with your Office / College Wi-Fi credentials (2.4 GHz Wi-Fi!)
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API Base URL:
// Option A (Recommended on same Wi-Fi LAN): Your Host PC LAN IP on Port 5000
const char* API_BASE_URL  = "http://192.168.1.14:5000/api/biometric";
// Option B (Over Internet from different Wi-Fi): Replace with live Cloudflare URL
// const char* API_BASE_URL = "https://classes-waterproof-posing-revolution.trycloudflare.com/api/biometric";

// Device Identity & Secret Key (Must match biometric_devices table on server)
const char* DEVICE_ID     = "DEVICE001";
const char* DEVICE_KEY    = "flymedia_esp32_key_2026";

// ===================== 2. PIN DEFINITIONS ========================
#define FP_RX_PIN        16   // Connect to R307 TX
#define FP_TX_PIN        17   // Connect to R307 RX

#define OLED_SDA_PIN     21
#define OLED_SCL_PIN     22
#define SCREEN_WIDTH     128
#define SCREEN_HEIGHT    64
#define OLED_I2C_ADDR    0x3C

// 5mm Common Anode RGB LED (LOW = ON, HIGH = OFF)
#define RGB_RED_PIN      26
#define RGB_GREEN_PIN    25
#define RGB_BLUE_PIN     33
#define RGB_COMMON_ANODE true

// Active Buzzer (HIGH = ON for most 3-pin active modules; change if active-low)
#define BUZZER_PIN       27
#define BUZZER_ACTIVE_HIGH true

// ===================== 3. TIMING & SECURITY ======================
const unsigned long LOCAL_SCAN_COOLDOWN_MS = 3000;   // 3s debounce on device
const unsigned long HEARTBEAT_INTERVAL_MS  = 30000;  // Ping server every 30s
const unsigned long WIFI_RETRY_INTERVAL_MS = 15000;  // Retry Wi-Fi every 15s
const int MAX_FAILED_STRIKES               = 3;      // Lockout after 3 bad scans
const unsigned long LOCKOUT_DURATION_MS    = 10000;  // 10s lockout

// ===================== 4. HARDWARE OBJECTS =======================
HardwareSerial fpSerial(2);
Adafruit_Fingerprint finger(&fpSerial);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Preferences prefs;

bool oledReady     = false;
bool sensorReady   = false;
uint32_t bootCount = 0;
uint32_t eventSeq  = 0;

unsigned long lastScanMs      = 0;
unsigned long lastHeartbeatMs = 0;
unsigned long lastWifiRetryMs = 0;
int failedStrikes             = 0;
unsigned long lockoutUntilMs  = 0;

// ===================== 5. FEEDBACK HELPERS =======================
void setRGB(bool r, bool g, bool b) {
  if (RGB_COMMON_ANODE) {
    digitalWrite(RGB_RED_PIN,   r ? LOW : HIGH);
    digitalWrite(RGB_GREEN_PIN, g ? LOW : HIGH);
    digitalWrite(RGB_BLUE_PIN,  b ? LOW : HIGH);
  } else {
    digitalWrite(RGB_RED_PIN,   r ? HIGH : LOW);
    digitalWrite(RGB_GREEN_PIN, g ? HIGH : LOW);
    digitalWrite(RGB_BLUE_PIN,  b ? HIGH : LOW);
  }
}

void beep(int durationMs, int count = 1, int gapMs = 80) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, BUZZER_ACTIVE_HIGH ? HIGH : LOW);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, BUZZER_ACTIVE_HIGH ? LOW : HIGH);
    if (i < count - 1) delay(gapMs);
  }
}

void showOLED(const String& line1, const String& line2 = "", const String& footer = "") {
  Serial.println("[OLED] " + line1 + (line2.length() ? " | " + line2 : ""));
  if (!oledReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header bar
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("FLY MEDIA");
  display.setCursor(80, 0);
  display.print(WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE");
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // Main Line 1
  display.setTextSize(1);
  display.setCursor(0, 18);
  display.println(line1);

  // Main Line 2 (highlighted larger if short)
  if (line2.length() > 0) {
    display.setTextSize(line2.length() <= 10 ? 2 : 1);
    display.setCursor(0, 34);
    display.println(line2);
  }

  // Footer
  if (footer.length() > 0) {
    display.setTextSize(1);
    display.setCursor(0, 55);
    display.print(footer);
  }
  display.display();
}

void showReadyScreen() {
  setRGB(false, false, true); // Soft blue = Ready/Idle
  int queued = prefs.getInt("q_count", 0);
  String footer = queued > 0 ? ("Pending sync: " + String(queued)) : String(DEVICE_ID);
  showOLED("Place Your Finger", "READY", footer);
}

// Minimal JSON string field extractor (no external JSON library needed)
String extractJsonField(const String& json, const String& key) {
  String pattern = "\"" + key + "\":\"";
  int start = json.indexOf(pattern);
  if (start == -1) return "";
  start += pattern.length();
  int end = json.indexOf("\"", start);
  if (end == -1) return "";
  return json.substring(start, end);
}

int extractJsonInt(const String& json, const String& key) {
  String pattern = "\"" + key + "\":";
  int start = json.indexOf(pattern);
  if (start == -1) return -1;
  start += pattern.length();
  while (start < (int)json.length() && json[start] == ' ') start++;
  int end = start;
  while (end < (int)json.length() && (isDigit(json[end]) || json[end] == '-')) end++;
  if (end == start) return -1;
  return json.substring(start, end).toInt();
}

// ===================== 6. NETWORK & HTTP =========================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  setRGB(false, false, true);
  showOLED("Connecting Wi-Fi...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WIFI] Connected! ESP32 IP: ");
    Serial.println(WiFi.localIP());
    showOLED("System Online", WiFi.localIP().toString());
    setRGB(false, true, false);
    beep(80, 2);
    delay(1200);
  } else {
    Serial.println("[WIFI] Connection failed. Running in Offline Queue mode.");
    showOLED("Network Offline", "Queue Mode");
    setRGB(true, false, false);
    beep(250, 1);
    delay(1200);
  }
}

int postJson(const String& path, const String& payload, String& responseOut) {
  if (WiFi.status() != WL_CONNECTED) return -1;

  String fullUrl = String(API_BASE_URL) + path;
  HTTPClient http;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (fullUrl.startsWith("https://")) {
    secureClient.setInsecure(); // Accepts Cloudflare edge TLS certificate
    http.begin(secureClient, fullUrl);
  } else {
    http.begin(plainClient, fullUrl);
  }

  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.addHeader("X-Device-Id", DEVICE_ID);

  int code = http.POST(payload);
  if (code > 0) {
    responseOut = http.getString();
  } else {
    responseOut = http.errorToString(code);
  }
  http.end();
  return code;
}

// ===================== 7. OFFLINE QUEUE (NVS) ====================
void enqueueOfflineEvent(uint16_t slot, const String& eventId) {
  int count = prefs.getInt("q_count", 0);
  if (count >= 25) {
    Serial.println("[QUEUE] Queue full (25 max), dropping oldest not implemented.");
    return;
  }
  String entry = String(slot) + "|" + eventId;
  prefs.putString(("q_" + String(count)).c_str(), entry);
  prefs.putInt("q_count", count + 1);
  Serial.println("[QUEUE] Saved offline event: " + entry);
}

void flushOfflineQueue() {
  if (WiFi.status() != WL_CONNECTED) return;
  int count = prefs.getInt("q_count", 0);
  if (count <= 0) return;

  Serial.printf("[QUEUE] Syncing %d offline scan(s)...\n", count);
  showOLED("Syncing Offline", String(count) + " event(s)");

  int remaining = 0;
  for (int i = 0; i < count; i++) {
    String key = "q_" + String(i);
    String entry = prefs.getString(key.c_str(), "");
    int sep = entry.indexOf('|');
    if (sep == -1) continue;

    int slot = entry.substring(0, sep).toInt();
    String evId = entry.substring(sep + 1);

    String payload = "{\"device_id\":\"" + String(DEVICE_ID) +
                     "\",\"fingerprint_slot\":" + String(slot) +
                     ",\"event_id\":\"" + evId + "\"}";
    String resp;
    int code = postJson("/scan", payload, resp);
    if (code >= 200 && code < 500) {
      Serial.println("[QUEUE] Synced: " + evId + " -> HTTP " + String(code));
    } else {
      // Keep unacknowledged event
      prefs.putString(("q_" + String(remaining)).c_str(), entry);
      remaining++;
    }
  }
  prefs.putInt("q_count", remaining);
  if (remaining == 0) {
    showOLED("Offline Synced!", "All Updated");
    delay(1000);
  }
  showReadyScreen();
}

// ===================== 8. ATTENDANCE SCAN SUBMIT =================
void submitAttendanceScan(uint16_t slotId) {
  eventSeq++;
  String eventId = String(DEVICE_ID) + "-" + String(bootCount) + "-" + String(eventSeq);

  String payload = "{\"device_id\":\"" + String(DEVICE_ID) +
                   "\",\"fingerprint_slot\":" + String(slotId) +
                   ",\"event_id\":\"" + eventId + "\"}";

  showOLED("Verified Slot #" + String(slotId), "Sending...");
  String resp;
  int code = postJson("/scan", payload, resp);

  Serial.printf("[SCAN] HTTP %d -> %s\n", code, resp.c_str());

  if (code >= 200 && code < 300) {
    String l1 = extractJsonField(resp, "display_line1");
    String l2 = extractJsonField(resp, "display_line2");
    if (l1.length() == 0) l1 = "Slot #" + String(slotId);
    if (l2.length() == 0) l2 = "Recorded!";

    setRGB(false, true, false); // Green LED
    showOLED(l1, l2, "Synced OK");
    beep(120, 1);
    delay(2200);
  } else if (code == 404 || code == 401 || code == 403) {
    String l1 = extractJsonField(resp, "display_line1");
    String l2 = extractJsonField(resp, "display_line2");
    if (l1.length() == 0) l1 = "Rejected";
    if (l2.length() == 0) l2 = "HTTP " + String(code);

    setRGB(true, false, false); // Red LED
    showOLED(l1, l2);
    beep(350, 2);
    delay(2200);
  } else {
    // Network / Server unreachable -> Save in offline queue!
    enqueueOfflineEvent(slotId, eventId);
    setRGB(true, true, false); // Yellow LED
    showOLED("Saved Offline", "Slot #" + String(slotId), "Will auto-sync");
    beep(100, 2);
    delay(2000);
  }
  showReadyScreen();
}

// ===================== 9. ENROLLMENT & DELETION ==================
bool enrollFingerprint(uint16_t id) {
  if (id < 1 || id > 1000) {
    Serial.println("[ENROLL] Invalid slot ID (must be 1..1000).");
    return false;
  }

  Serial.printf("\n[ENROLL] Starting 2-scan enrollment for Slot #%d\n", id);
  setRGB(false, false, true);
  showOLED("Enroll Slot #" + String(id), "Place Finger");
  beep(100, 2);

  // --- First scan ---
  unsigned long start = millis();
  int p = -1;
  while (p != FINGERPRINT_OK) {
    if (millis() - start > 20000) {
      showOLED("Enroll Timeout", "Cancelled");
      setRGB(true, false, false);
      delay(1500);
      showReadyScreen();
      return false;
    }
    p = finger.getImage();
    delay(50);
  }

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    showOLED("Scan 1 Error", "Try Again");
    setRGB(true, false, false);
    beep(300, 1);
    delay(1500);
    showReadyScreen();
    return false;
  }

  showOLED("Scan 1 OK!", "Remove Finger");
  beep(80, 1);
  delay(1500);
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    delay(50);
  }

  // --- Second scan (confirmation) ---
  showOLED("Enroll Slot #" + String(id), "Place Again");
  start = millis();
  p = -1;
  while (p != FINGERPRINT_OK) {
    if (millis() - start > 20000) {
      showOLED("Enroll Timeout", "Cancelled");
      setRGB(true, false, false);
      delay(1500);
      showReadyScreen();
      return false;
    }
    p = finger.getImage();
    delay(50);
  }

  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    showOLED("Scan 2 Error", "Try Again");
    setRGB(true, false, false);
    beep(300, 1);
    delay(1500);
    showReadyScreen();
    return false;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    showOLED("Fingers Did Not", "Match!");
    setRGB(true, false, false);
    beep(400, 2);
    delay(1800);
    showReadyScreen();
    return false;
  }

  if (finger.storeModel(id) != FINGERPRINT_OK) {
    showOLED("Store Failed", "Slot #" + String(id));
    setRGB(true, false, false);
    beep(400, 2);
    delay(1800);
    showReadyScreen();
    return false;
  }

  Serial.printf("[ENROLL] SUCCESS! Stored in Slot #%d\n", id);
  setRGB(false, true, false);
  showOLED("Enrolled OK!", "Slot #" + String(id));
  beep(100, 3);
  delay(2000);
  showReadyScreen();
  return true;
}

bool deleteFingerprint(uint16_t id) {
  uint8_t p = finger.deleteModel(id);
  if (p == FINGERPRINT_OK) {
    Serial.printf("[DELETE] Deleted Slot #%d\n", id);
    setRGB(false, true, false);
    showOLED("Template Deleted", "Slot #" + String(id));
    beep(120, 2);
    delay(1500);
    showReadyScreen();
    return true;
  }
  Serial.printf("[DELETE] Failed to delete Slot #%d (code %d)\n", id, p);
  showOLED("Delete Failed", "Slot #" + String(id));
  setRGB(true, false, false);
  delay(1500);
  showReadyScreen();
  return false;
}

// ===================== 10. HEARTBEAT & REMOTE COMMANDS ===========
void sendHeartbeatAndCheckCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\"}";
  String resp;
  int code = postJson("/heartbeat", payload, resp);
  Serial.printf("[HEARTBEAT] HTTP %d\n", code);

  if (code == 200) {
    // Also flush any queued offline scans while server is reachable
    flushOfflineQueue();

    // Check if Admin/HR queued a remote ENROLL or DELETE command
    String cmd = extractJsonField(resp, "command");
    if (cmd.length() > 0) {
      int cmdId = extractJsonInt(resp, "command_id");
      int slot  = extractJsonInt(resp, "fingerprint_slot");
      bool ok   = false;
      String msg = "";

      if (cmd == "ENROLL" && slot > 0) {
        ok = enrollFingerprint(slot);
        msg = ok ? "Enrolled on R307" : "Enrollment failed or timed out";
      } else if (cmd == "DELETE" && slot > 0) {
        ok = deleteFingerprint(slot);
        msg = ok ? "Deleted from R307" : "Delete failed";
      } else if (cmd == "CLEAR_ALL") {
        ok = (finger.emptyDatabase() == FINGERPRINT_OK);
        msg = ok ? "Cleared all templates" : "Clear failed";
      }

      if (cmdId > 0) {
        String resPayload = "{\"device_id\":\"" + String(DEVICE_ID) +
                            "\",\"command_id\":" + String(cmdId) +
                            ",\"success\":" + String(ok ? "true" : "false") +
                            ",\"message\":\"" + msg + "\"}";
        String ack;
        postJson("/command-result", resPayload, ack);
      }
    }
  }
}

// ===================== 11. SERIAL MONITOR COMMANDS ===============
void handleSerialCommands() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return;

  if (line.startsWith("ENROLL ")) {
    int slot = line.substring(7).toInt();
    enrollFingerprint(slot);
  } else if (line.startsWith("DELETE ")) {
    int slot = line.substring(7).toInt();
    deleteFingerprint(slot);
  } else if (line == "CLEAR") {
    if (finger.emptyDatabase() == FINGERPRINT_OK) {
      Serial.println("[SENSOR] All fingerprint templates erased!");
      showOLED("Database Cleared", "0 Templates");
      delay(1500);
      showReadyScreen();
    }
  } else if (line == "TEST") {
    sendHeartbeatAndCheckCommands();
  } else if (line == "STATUS") {
    finger.getTemplateCount();
    Serial.println("========== TERMINAL STATUS ==========");
    Serial.println("Device ID : " + String(DEVICE_ID));
    Serial.println("API URL   : " + String(API_BASE_URL));
    Serial.println("Wi-Fi     : " + String(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "OFFLINE"));
    Serial.println("Templates : " + String(finger.templateCount) + " / 1000");
    Serial.println("Queued    : " + String(prefs.getInt("q_count", 0)));
    Serial.println("=====================================");
  } else {
    Serial.println("Commands: ENROLL <1-1000> | DELETE <1-1000> | CLEAR | TEST | STATUS");
  }
}

// ===================== 12. SETUP & MAIN LOOP =====================
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== Fly Media ESP32 Biometric Terminal Booting ===");

  pinMode(RGB_RED_PIN, OUTPUT);
  pinMode(RGB_GREEN_PIN, OUTPUT);
  pinMode(RGB_BLUE_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, BUZZER_ACTIVE_HIGH ? LOW : HIGH);
  setRGB(false, false, true);

  // Initialize NVS flash storage
  prefs.begin("biometric", false);
  bootCount = prefs.getUInt("boot_cnt", 0) + 1;
  prefs.putUInt("boot_cnt", bootCount);

  // Initialize OLED
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    oledReady = true;
    showOLED("DeviceDesk", "Initializing...");
  } else {
    Serial.println("[OLED] SSD1306 not found at 0x3C (continuing without OLED).");
  }

  // Initialize R307 Fingerprint Sensor on UART2
  fpSerial.begin(57600, SERIAL_8N1, FP_RX_PIN, FP_TX_PIN);
  finger.begin(57600);
  delay(200);

  if (finger.verifyPassword()) {
    sensorReady = true;
    // Set highest matching strictness (Security Level 5)
    finger.setSecurityLevel(5);
    finger.getTemplateCount();
    Serial.printf("[R307] Sensor OK! Security Level=5 | Stored Templates=%d\n", finger.templateCount);
    showOLED("R307 Sensor OK", String(finger.templateCount) + " Enrolled");
    delay(1000);
  } else {
    sensorReady = false;
    Serial.println("[R307] ERROR: Sensor not detected! Check TX/RX (GPIO 16/17) and power.");
    setRGB(true, false, false);
    showOLED("Sensor Error!", "Check R307 Wire");
    beep(500, 3);
    while (true) {
      handleSerialCommands();
      delay(500);
    }
  }

  connectWiFi();
  sendHeartbeatAndCheckCommands();
  showReadyScreen();
}

void loop() {
  handleSerialCommands();

  // Reconnect Wi-Fi periodically if disconnected
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiRetryMs > WIFI_RETRY_INTERVAL_MS) {
    lastWifiRetryMs = millis();
    connectWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      flushOfflineQueue();
    }
    showReadyScreen();
  }

  // Periodic heartbeat + check for remote Admin Enroll/Delete commands
  if (millis() - lastHeartbeatMs > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = millis();
    sendHeartbeatAndCheckCommands();
  }

  // Handle 3-strike lockout cooldown
  if (lockoutUntilMs > 0) {
    if (millis() < lockoutUntilMs) {
      delay(100);
      return;
    } else {
      lockoutUntilMs = 0;
      failedStrikes = 0;
      showReadyScreen();
    }
  }

  // Wait for finger on R307
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) {
    delay(60);
    return;
  }

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    delay(100);
    return;
  }

  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    if (millis() - lastScanMs < LOCAL_SCAN_COOLDOWN_MS) {
      return;
    }
    lastScanMs = millis();
    failedStrikes = 0;

    Serial.printf("[R307] MATCH! Slot #%d (Confidence: %d)\n", finger.fingerID, finger.confidence);
    submitAttendanceScan(finger.fingerID);
  } else if (p == FINGERPRINT_NOTFOUND) {
    failedStrikes++;
    Serial.printf("[R307] NOT RECOGNIZED (Strike %d/%d)\n", failedStrikes, MAX_FAILED_STRIKES);
    setRGB(true, false, false);
    showOLED("Not Recognised", "Try Again", "Strike " + String(failedStrikes) + "/3");
    beep(300, 2);

    // Report failed attempt to server for audit
    String dummy;
    postJson("/scan-failed", "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"reason\":\"Unrecognized fingerprint\"}", dummy);

    if (failedStrikes >= MAX_FAILED_STRIKES) {
      lockoutUntilMs = millis() + LOCKOUT_DURATION_MS;
      showOLED("Too Many Fails", "Locked 10s");
      beep(600, 1);
    } else {
      delay(1500);
      showReadyScreen();
    }
  }
  delay(100);
}
