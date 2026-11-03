"use client";

import { motion } from "framer-motion";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { loginAction } from "./actions";
import { 
  Shield, 
  BarChart3, 
  LayoutDashboard, 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  Rocket,
  Globe
} from "lucide-react";

export default function LoginPage() {
  return (
    <main className="login-wrap" id="main">
      <div className="login-container">
        {/* Left Card: Yakunex Brand & Ecosystem */}
        <motion.section 
          className="login-left-card animate-fade-in-up"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <div className="login-card-header">
              <div className="login-card-logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/logo.png" 
                  alt="Yakunex Logo" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Yakunex&background=fbbf24&color=000';
                  }}
                />
              </div>
              <div className="login-card-header-text">
                <h3>Yakunex CPMS</h3>
                <p>Enterprise Project Ecosystem</p>
              </div>
            </div>

            <h1 className="login-card-title">
              Master Your Workflow <span className="highlight">with Yakunex</span>
            </h1>
            <p className="login-card-desc">
              The ultimate client and project management solution for high-performance teams. 
              Streamline your business operations with world-class efficiency.
            </p>

            <div className="feature-list-alt">
              <div className="feature-item-alt">
                <div className="feature-icon-alt"><LayoutDashboard size={16} /></div>
                <span className="feature-text-alt">Unified Project Dashboard</span>
              </div>
              <div className="feature-item-alt">
                <div className="feature-icon-alt"><Users size={16} /></div>
                <span className="feature-text-alt">Multi-tenant Isolation & Collaboration</span>
              </div>
              <div className="feature-item-alt">
                <div className="feature-icon-alt"><BarChart3 size={16} /></div>
                <span className="feature-text-alt">Advanced Business Analytics</span>
              </div>
              <div className="feature-item-alt">
                <div className="feature-icon-alt"><Shield size={16} /></div>
                <span className="feature-text-alt">Secure Enterprise RBAC Control</span>
              </div>
            </div>
          </div>

          <div className="login-card-footer">
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span>yakunex.com</span>
            </div>
            <span>&copy; {new Date().getFullYear()} Yakunex Technologies</span>
          </div>
        </motion.section>

        {/* Right Card: Sign In Form */}
        <motion.section 
          className="login-right-card animate-fade-in-up"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="login-form-header">
            <h2>Sign in</h2>
            <p>Welcome back! Please enter your credentials.</p>
          </div>

          <ActionForm action={loginAction} className="login-form-alt">
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" size={18} />
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  placeholder="admin@yakunex.com" 
                  required 
                />
              </div>
            </div>

            <div className="field">
              <div className="password-header">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot?</a>
              </div>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" size={18} />
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  placeholder="••••••••" 
                  required 
                />
                <Eye className="login-input-eye" size={18} />
              </div>
            </div>

            <label className="remember-me">
              <input type="checkbox" name="remember" />
              <span>Keep me signed in</span>
            </label>

            <button type="submit" className="btn-signin">
              Access Dashboard
            </button>
          </ActionForm>

          <div className="login-card-footer">
            <span>Powered by <strong>Yakunex</strong></span>
            <span>support@yakunex.com</span>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
