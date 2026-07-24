/**
 * Formats a Sri Lankan phone number into the international format without a leading +
 * e.g. 0771234567 -> 94771234567
 *      771234567  -> 94771234567
 *      +94771234567 -> 94771234567
 */
function formatPhoneNumber(phone: string): string {
  // Remove spaces, hyphens, plus signs, parentheses
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, "");

  // If it starts with 0, replace with 94
  if (cleaned.startsWith("0")) {
    cleaned = "94" + cleaned.substring(1);
  }

  // If it is 9 digits and starts with 7 (e.g. 771234567), prepend 94
  if (cleaned.length === 9 && cleaned.startsWith("7")) {
    cleaned = "94" + cleaned;
  }

  return cleaned;
}

/**
 * Sends an SMS to a recipient using Notify.lk API.
 * If credentials are not set in .env.local, it falls back to console logging.
 * 
 * @param to Recipient's phone number
 * @param message Message body
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const userId = process.env.NOTIFY_LK_USER_ID;
  const apiKey = process.env.NOTIFY_LK_API_KEY;
  const senderId = process.env.NOTIFY_LK_SENDER_ID || "NotifyDEMO";

  const formattedPhone = formatPhoneNumber(to);

  // Console fallback if API credentials are not provided (essential for free testing/development)
  if (!userId || !apiKey) {
    console.log(`\n=================== [SMS SIMULATION] ===================`);
    console.log(`To: ${formattedPhone} (${to})`);
    console.log(`Sender ID: ${senderId}`);
    console.log(`Message: ${message}`);
    console.log(`========================================================\n`);
    return true;
  }

  try {
    const url = new URL("https://app.notify.lk/api/v1/send");
    url.searchParams.append("user_id", userId);
    url.searchParams.append("api_key", apiKey);
    url.searchParams.append("sender_id", senderId);
    url.searchParams.append("to", formattedPhone);
    url.searchParams.append("message", message);

    const response = await fetch(url.toString(), {
      method: "GET",
    });

    const data = await response.json();
    console.log(`[Notify.lk SMS Response]`, data);

    // Notify.lk returns {"status": "success", "data": ...} or similar structure
    if (response.ok && (data.status === "success" || data.status === "sent" || data.code === 200)) {
      return true;
    }

    console.error(`[Notify.lk SMS Error] Failed to send SMS. Response:`, data);
    return false;
  } catch (error) {
    console.error(`[Notify.lk SMS Exception] Failed to send SMS:`, error);
    return false;
  }
}
