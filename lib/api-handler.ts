import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { z } from "zod";

type Role = "super_admin" | "admin" | "receptionist";

interface HandlerOptions {
  requireAuth?: boolean;
  requiredRole?: Role | Role[];
  schema?: z.ZodType<any, any>;
}

export function apiHandler(
  handler: (req: Request, context: { params: any; session: any; body?: any }) => Promise<NextResponse>,
  options: HandlerOptions = { requireAuth: true }
) {
  return async (req: Request, context: { params: any }) => {
    try {
      // 1. Authentication Check
      let session = null;
      if (options.requireAuth) {
        session = await getServerSession(authOptions);
        if (!session || !session.user) {
          return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        // 2. Role-Based Access Control (RBAC)
        if (options.requiredRole) {
          const userRole = (session.user as any).role as Role;
          const allowedRoles = Array.isArray(options.requiredRole) ? options.requiredRole : [options.requiredRole];
          
          if (!allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
          }
        }
      }

      // 3. Database Connection
      await connectToDatabase();

      // 4. Request Body Validation (for POST/PUT)
      let body = undefined;
      if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        try {
          body = await req.json();
        } catch (e) {
          body = {}; // Empty body if json parsing fails
        }

        if (options.schema) {
          const validationResult = options.schema.safeParse(body);
          if (!validationResult.success) {
            console.error("[API_VALIDATION_ERROR]", JSON.stringify(validationResult.error.errors, null, 2));
            return NextResponse.json({ 
              error: "Validation Error", 
              details: validationResult.error.errors 
            }, { status: 400 });
          }
          body = validationResult.data; // Use the sanitized/validated data
        }
      }

      // 5. Execute Handler
      return await handler(req, { ...context, session, body });

    } catch (error: any) {
      console.error("[API_HANDLER_ERROR]", error);
      
      // Global Error Handling
      if (error.name === "MongoServerError" && error.code === 11000) {
        return NextResponse.json({ error: "Duplicate key error (Record already exists)" }, { status: 409 });
      }
      
      return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
