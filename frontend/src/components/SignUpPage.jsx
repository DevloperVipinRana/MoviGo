import React, { useState } from "react";
import { signUpStyles, signUpCSS } from "../assets/dummyStyles";
import { ToastContainer } from "react-toastify";
import { ArrowLeft, Clapperboard, Mail, Phone, Ticket, User } from "lucide-react";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  //function to validate whether all fields are filled or not
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13) {
        newErrors.birthDate = "You must be at least 13 years old";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goBack = () => {
    window.history.back();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors.");
      return;
    }

    console.log("Form Data:", {
      ...formData,
      password: "***" + formData.password.slice(-2),
    });
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast.success("Account created successfully!Redirecting to Login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }, 1500);
  };

  return (
    <div className={signUpStyles.container}>
      <div className={signUpStyles.particlesContainer}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={signUpStyles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className={signUpStyles.gradientOrbs}>
        <div className={signUpStyles.orb1}></div>
        <div className={signUpStyles.orb2}></div>
      </div>

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

      <div className={signUpStyles.mainContent}>
        <button onClick={goBack} className={signUpStyles.backButton}>
          <ArrowLeft size={20} className={signUpStyles.backIcon} />
          <span className={signUpStyles.backText}>BACK</span>
        </button>

        <div className={signUpStyles.card}>
          <div className={signUpStyles.cardHeader}></div>

          <div className={signUpStyles.cardContent}>
            <div className={signUpStyles.header}>
              <div className={signUpStyles.headerFlex}>
                <Ticket className={signUpStyles.headerIcon} size={32} />
                <h2 className={signUpStyles.headerTitle}>JOIN OUR CINEMA</h2>
              </div>
              <p className={signUpStyles.headerSubtitle}>
                Create your account and start your cinematic journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={signUpStyles.form}>
              <div className={signUpStyles.formGrid}>
                <div>
                  <label htmlFor="fullName" className={signUpStyles.field}>
                    FULL NAME
                  </label>
                  <div className={signUpStyles.inputContainer}>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`${signUpStyles.input.base} ${errors.fullName ? signUpStyles.input.error : signUpStyles.input.normal} ${signUpStyles.inputWithIcon}`}
                      placeholder="Enter your Full Name"
                    />
                    <div className={signUpStyles.inputIcon}>
                      <User size={18} />
                    </div>
                  </div>
                  {errors.fullName && (
                    <p className={signUpStyles.errorText}>{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="username" className={signUpStyles.field}>
                    USERNAME
                  </label>
                  <div className={signUpStyles.inputContainer}>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className={`${signUpStyles.input.base} ${errors.username ? signUpStyles.input.error : signUpStyles.input.normal} ${signUpStyles.inputWithIcon}`}
                      placeholder="Choose a username"
                    />
                    <div className={signUpStyles.inputIcon}>
                      <Clapperboard size={18} />
                    </div>
                  </div>
                  {errors.username && (
                    <p className={signUpStyles.errorText}>{errors.username}</p>
                  )}
                </div>
              </div>

              <div className={signUpStyles.formGrid}>
                <div>
                  <label htmlFor="email" className={signUpStyles.field}>
                    EMAIL ADDRESS
                  </label>
                  <div className={signUpStyles.inputContainer}>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`${signUpStyles.input.base} ${errors.email ? signUpStyles.input.error : signUpStyles.input.normal} ${signUpStyles.inputWithIcon}`}
                      placeholder="your@example.com"
                    />
                    <div className={signUpStyles.inputIcon}>
                      <Mail size={18} />
                    </div>
                  </div>
                  {errors.email && (
                    <p className={signUpStyles.errorText}>{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className={signUpStyles.field}>
                    PHONE NUMBER
                  </label>
                  <div className={signUpStyles.inputContainer}>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${signUpStyles.input.base} ${errors.phone ? signUpStyles.input.error : signUpStyles.input.normal} ${signUpStyles.inputWithIcon}`}
                      placeholder="+1 (555) 23-456789"
                    />
                    <div className={signUpStyles.inputIcon}>
                      <Phone size={18} />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className={signUpStyles.errorText}>{errors.phone}</p>
                  )}
                </div>

              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
