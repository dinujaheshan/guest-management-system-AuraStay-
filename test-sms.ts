import { sendSMS } from "./lib/sms";
import { config } from "dotenv";

config({ path: ".env.local" });

async function test() {
  console.log("Testing SMS sending...");
  console.log("USER_ID:", process.env.NOTIFY_LK_USER_ID);
  
  // Replace with a valid test number. We don't have the user's number, but we can see the error response from Notify.lk API even for an invalid number. Or we can just log the response.
  const res = await sendSMS("0771234567", "Test message");
  console.log("Result:", res);
}

test();
