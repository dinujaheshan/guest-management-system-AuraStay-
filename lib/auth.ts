import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectToDatabase();
          const user = await User.findOne({ email: credentials.email }).lean();

          if (user && user.password === credentials.password) {
            if (user.status !== "active") {
              throw new Error("Account is disabled");
            }
            return { id: user._id.toString(), email: user.email, name: user.name, role: user.role, permissions: Array.isArray(user.permissions) ? Array.from(user.permissions) : [] };
          }
        } catch (e) {
          console.error("Database error or not seeded yet, using hardcoded fallback", e);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          try {
            await connectToDatabase();
            const user = await User.findById(token.id).lean();
            if (user) {
              (session.user as any).role = user.role;
              (session.user as any).permissions = Array.isArray(user.permissions) ? Array.from(user.permissions) : [];
            } else {
              (session.user as any).role = token.role;
              (session.user as any).permissions = Array.isArray(token.permissions) ? Array.from(token.permissions) : [];
            }
          } catch (e) {
            (session.user as any).role = token.role;
            (session.user as any).permissions = Array.isArray(token.permissions) ? Array.from(token.permissions) : [];
          }
        } else {
          (session.user as any).role = token.role;
          (session.user as any).permissions = token.permissions || [];
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
