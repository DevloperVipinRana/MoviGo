import React, { useState } from "react";
import { loginStyles } from "../assets/dummyStyles";
import { toast, ToastContainer } from "react-toastify";
import {
  ArrowLeft,
  Clapperboard,
  Eye,
  EyeOff,
  Film,
  Popcorn,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formData.password || formData.password.length < 6) {
      toast.error("password must be at least 6 characters long");
      return;
    }

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };
      const res = await axios.post(`${API_BASE}/api/auth/login`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = res.data;
      if (data && data.success) {
        toast.success(data.message || "Login successful! Redirecting...");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        try {
          const userToStore = data.user || { email: formData.email };
          localStorage.setItem(
            "cine_auth",
            JSON.stringify({
              isLoggedIn: true,
              email: userToStore.email || formData.email,
            }),
          );
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem(
            "userEmail",
            userToStore.email || formData.email || "",
          );
          localStorage.setItem(
            "cine_user_email",
            userToStore.email || formData.email || "",
          );
          localStorage.setItem("user", JSON.stringify(userToStore));
        } catch (err) {
          console.warn("Failed to persist full user obj");
        }

        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        toast.error(data?.message || "Login Failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      const serverMsg =
        err?.response?.data?.message || err?.message || "Server error";

      // Map common backend messages to specific UI responses
      const msgLower = String(serverMsg).toLowerCase();
      if (msgLower.includes("password") || msgLower.includes("invalid")) {
        toast.error(serverMsg);
      } else if (msgLower.includes("email")) {
        toast.error(serverMsg);
      } else {
        toast.error(serverMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    window.location.href = '/';
  };

  return (
    <div className={loginStyles.pageContainer}>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <div className="relative w-full max-w-md z-10">
        <div className={loginStyles.backButtonContainer}>
          <button onClick={goBack} className={loginStyles.backButton}>
            <ArrowLeft size={20} className={loginStyles.backButtonIcon} />
            <span className={loginStyles.backButtonText}>Back to Home</span>
          </button>
        </div>

        <div className={loginStyles.cardContainer}>
          <div className={loginStyles.cardHeader}></div>

          <div className={loginStyles.cardContent}>
            <div className={loginStyles.headerContainer}>
              <div className={loginStyles.headerIconContainer}>
                <Film className={loginStyles.headerIcon} size={28} />
                <h2 className={loginStyles.headerTitle}>MOVIGO ACCESS</h2>
              </div>
              <p className={loginStyles.headerSubtitle}>
                Enter your credentials to continue the experience
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={loginStyles.inputGroup}>
                <label htmlFor="email" className={loginStyles.label}>
                  EMAIL ADDRESS
                </label>
                <div className={loginStyles.inputContainer}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={loginStyles.input}
                    placeholder="Your Email Address"
                  />
                  <div className={loginStyles.inputIcon}>
                    <Clapperboard size={16} className="text-red-500" />
                  </div>
                </div>
              </div>

              <div className={loginStyles.inputGroup}>
                <label htmlFor="password" className={loginStyles.label}>
                  PASSWORD
                </label>
                <div className={loginStyles.inputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={loginStyles.inputWithIcon}
                    placeholder="Your Password"
                  />
                  <button
                    type="button"
                    className={loginStyles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                        className={loginStyles.passwordToggleIcon}
                      />
                    ) : (
                      <Eye
                        size={18}
                        className={loginStyles.passwordToggleIcon}
                      />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`${loginStyles.submitButton} ${isLoading ? loginStyles.submitButtonDisabled : ""}`}
              >
                {isLoading ? (
                  <div className={loginStyles.buttonContent}>
                    <div className={loginStyles.loadingSpinner}></div>
                    <span className={loginStyles.buttonText}>
                      SIGNING IN...
                    </span>
                  </div>
                ) : (
                  <div className={loginStyles.buttonContent}>
                    <Popcorn size={18} className={loginStyles.buttonIcon} />
                    <span className={loginStyles.buttonText}>
                      ACCESS YOUR ACCOUNT
                    </span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className={loginStyles.footerContainer}>
          <p className={loginStyles.footerText}>
            Don't have an account?{" "}
            <a href="/signup" className={loginStyles.footerLink}>
              Create one now
            </a>
          </p>
        </div>
      </div>

      <style>{loginStyles.customCSS}</style>
    </div>
  );
};

export default LoginPage;
