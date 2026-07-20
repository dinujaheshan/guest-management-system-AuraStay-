import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { businessSettingSchema } from "@/lib/validations";
import { BusinessSetting } from "@/models/BusinessSetting";

export const GET = apiHandler(async (req) => {
  const settings = await BusinessSetting.findOne({});
  return NextResponse.json(settings || {});
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  let settings = await BusinessSetting.findOne({});
  if (settings) {
    settings = await BusinessSetting.findByIdAndUpdate(settings._id, body, { new: true });
  } else {
    settings = await BusinessSetting.create(body);
  }
  return NextResponse.json(settings);
}, { requireAuth: true, requiredRole: ["super_admin", "admin"], schema: businessSettingSchema });
