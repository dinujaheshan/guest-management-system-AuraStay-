"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MdEmail, MdLock, MdLogin } from "react-icons/md";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { motion } from "framer-motion";
import { useSettings } from "@/components/settings-provider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { systemName, businessName, logo } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Premium Ambient Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[140px] animate-pulse duration-[12s]" />
        <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[140px] animate-pulse duration-[12s] delay-3000" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-card/60 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />

        <motion.div variants={itemVariants} className="mb-8 text-center mt-2 flex flex-col items-center">
          {logo ? (
            <img src={logo} alt="Logo" className="h-16 w-auto mb-4 drop-shadow-md object-contain" />
          ) : (
            <Logo className="w-16 h-16 mb-4 drop-shadow-md" />
          )}
          <h1 className="text-3xl font-black tracking-tight text-primary">{systemName}</h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium">{businessName}</p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/15 border border-destructive/30 text-destructive text-sm p-3 rounded-xl mb-6 flex items-center shadow-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <motion.div variants={itemVariants}>
            <label className="text-sm font-medium mb-1.5 block text-foreground/90">Email Address</label>
            <div className="relative group">
              <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/80 group-focus-within:text-primary transition-colors pointer-events-none z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background/50 border border-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm backdrop-blur-sm"
                placeholder="admin@ghrms.com"
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="text-sm font-medium mb-1.5 block text-foreground/90">Password</label>
            <div className="relative group">
              <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/80 group-focus-within:text-primary transition-colors pointer-events-none z-10" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background/50 border border-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm backdrop-blur-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
            >
              <MdLogin className="mr-2 h-5 w-5" />
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </Button>
          </motion.div>
        </form>

      </motion.div>
    </div>
  );
}
