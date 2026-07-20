import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "super_admin" && (session.user as any).role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    // Prevent non-super_admin from updating super_admin
    const existingUser = await User.findById(params.id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.role === "super_admin" && (session.user as any).role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can modify another Super Admin" }, { status: 403 });
    }

    // Don't update password if it's empty
    if (!body.password || body.password.trim() === "") {
      delete body.password;
    }

    const user = await User.findByIdAndUpdate(params.id, body, { new: true, runValidators: true }).select("-password");
    
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "super_admin" && (session.user as any).role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    
    // Prevent non-super_admin from deleting super_admin
    const existingUser = await User.findById(params.id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.role === "super_admin" && (session.user as any).role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can delete a Super Admin" }, { status: 403 });
    }

    // Prevent deleting oneself
    if (existingUser.email === session.user?.email) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await User.findByIdAndDelete(params.id);
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
