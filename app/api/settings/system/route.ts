import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { systemSettingSchema } from "@/lib/validations";
import { SystemSetting } from "@/models/SystemSetting";

export const GET = apiHandler(async (req) => {
  const settings = await SystemSetting.findOne({});
  return NextResponse.json(settings || {});
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  let settings = await SystemSetting.findOne({});
  if (settings) {
    settings = await SystemSetting.findByIdAndUpdate(settings._id, body, { new: true });
  } else {
    settings = await SystemSetting.create(body);
  }
  return NextResponse.json(settings);
}, { requireAuth: true, requiredRole: ["super_admin", "admin"], schema: systemSettingSchema });
