"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ActionForm, SubmitButton } from "@/components/form";
import { loginAction } from "./actions";
import {
  Shield,
  BarChart3,
  LayoutDashboard,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";

function DbErrorBanner() {
  const searchParams = useSearchParams();
  const isDbOffline = searchParams.get("error") === "db_offline";
  if (!isDbOffline) return null;
  return (
    <div 
      className="alert alert-error" 
      style={{ 
        marginBottom: "1.25rem", 
        borderRadius: "10px", 
        fontSize: "0.85rem",
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        color: "#fca5a5",
        padding: "0.75rem 1rem",
        lineHeight: "1.4"
      }}
    >
      ⚠️ <strong>MySQL is not running:</strong> Please open <strong>XAMPP Control Panel</strong> and click <strong>Start</strong> next to <strong>MySQL</strong>.
    </div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  const fillDemo = (email: string, pass: string) => {
    setEmailValue(email);
    setPasswordValue(pass);
  };

  return (
    <main className="login-wrap" id="main">
      {/* Ambient background glow orbs */}
      <div className="login-glow-orb glow-top-left" aria-hidden="true" />
      <div className="login-glow-orb glow-bottom-right" aria-hidden="true" />
      <div className="login-grid-pattern" aria-hidden="true" />

      <div className="login-container">
        {/* Left Card: Brand Showcase & Ecosystem */}
        <motion.section
          className="login-left-card"
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div>
            <div className="login-brand-badge">
              <span className="live-status-dot" />
              <span>CPMS Enterprise v2.0</span>
            </div>

            <div className="login-card-header">
              <div className="login-card-logo-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Yakunex Logo"
                  width={68}
                  height={68}
                  style={{
                    width: '68px',
                    height: '68px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.65))'
                  }}
                />
              </div>

              <div className="login-card-header-text">
                <h3>Yakunex</h3>
                <p>Client & Project Management Ecosystem</p>
              </div>
            </div>

            <h1 className="login-card-title">
              Next-Gen Management <span className="highlight">for Agile Teams</span>
            </h1>
            <p className="login-card-desc">
              Streamline enterprise workflows, client engagements, real-time collaboration, and automated milestone tracking in one unified interface.
            </p>

            <div className="feature-list-alt">
              <div className="feature-item-alt">
                <div className="feature-icon-alt"><LayoutDashboard size={16} /></div>
                <div className="feature-text-block">
                  <strong>Unified Mission Control</strong>
                  <span>Live Kanban boards, deliverables, and progress tracking</span>
                </div>
              </div>

              <div className="feature-item-alt">
                <div className="feature-icon-alt"><Clock size={16} /></div>
                <div className="feature-text-block">
                  <strong>Integrated Time Tracking</strong>
                  <span>Real-time work sessions stopwatch with instant logging</span>
                </div>
              </div>

              <div className="feature-item-alt">
                <div className="feature-icon-alt"><BarChart3 size={16} /></div>
                <div className="feature-text-block">
                  <strong>Automated Deadline Alerts</strong>
                  <span>Multi-channel deadline warnings and real-time SSE streaming</span>
                </div>
              </div>

              <div className="feature-item-alt">
                <div className="feature-icon-alt"><Shield size={16} /></div>
                <div className="feature-text-block">
                  <strong>Role-Based Access Control</strong>
                  <span>Enterprise security with granular permissions and audit trails</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-card-footer">
            <div className="trust-indicator">
              <CheckCircle2 size={14} color="#10b981" />
              <span>Encrypted Session • High Availability</span>
            </div>
            <span>&copy; {new Date().getFullYear()} Yakunex Technologies</span>
          </div>
        </motion.section>

        {/* Right Card: Sign In Portal */}
        <motion.section
          className="login-right-card"
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        >
          <div className="login-form-header">
            <div className="login-portal-pill">
              <Sparkles size={13} />
              <span>Secure Access Portal</span>
            </div>
            <h2>Welcome Back</h2>
            <p>Enter your professional credentials to continue</p>
          </div>

          <Suspense fallback={null}>
            <DbErrorBanner />
          </Suspense>

          {/* Quick Demo Credentials Bar */}
          <div className="demo-credentials-box">
            <span className="demo-label">Quick Demo Logins:</span>
            <div className="demo-chips">
              <button
                type="button"
                className="demo-chip demo-admin"
                onClick={() => fillDemo("admin@yakunex.example", "Admin@12345")}
              >
                Admin User
              </button>
              <button
                type="button"
                className="demo-chip demo-staff"
                onClick={() => fillDemo("kasun@yakunex.example", "Staff@12345")}
              >
                Staff (Kasun)
              </button>
            </div>
          </div>

          <ActionForm action={loginAction} className="login-form-alt">
            <div className="field">
              <label htmlFor="email">Work Email</label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" size={18} />
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="name@yakunex.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <div className="password-header">
                <label htmlFor="password">Password</label>
                <span className="secure-badge">
                  <Lock size={11} /> Secure sign-in
                </span>
              </div>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-input-eye"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-form-options">
              <label className="remember-me">
                <input type="checkbox" name="remember" defaultChecked />
                <span>Remember this device</span>
              </label>
            </div>

            <SubmitButton className="btn-signin">
              <span>Sign in to Workspace</span>
              <ArrowRight size={18} />
            </SubmitButton>
          </ActionForm>

          <div className="login-card-footer">
            <span>Powered by <strong>Yakunex Cloud</strong></span>
            <span>support@yakunex.com</span>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
