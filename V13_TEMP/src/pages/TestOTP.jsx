import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const TestOTP = () => {
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [confirmResult, setConfirmResult] = useState(null);
    const [recaptchaReady, setRecaptchaReady] = useState(false);

    // Initialize reCAPTCHA once on mount
    useEffect(() => {
        console.log("Firebase Auth:", auth.app.options.projectId);
        console.log("Domain:", window.location.hostname);

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            initRecaptcha();
        }, 500);

        return () => {
            clearTimeout(timer);
            // Cleanup on unmount
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch (e) { }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const initRecaptcha = async () => {
        try {
            // Clear old instance
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch (e) { }
                window.recaptchaVerifier = null;
            }

            const container = document.getElementById("recaptcha-box");
            if (!container) {
                console.error("recaptcha-box not found!");
                setMessage("reCAPTCHA container missing. Refresh page.");
                return;
            }
            container.innerHTML = "";

            console.log("Creating RecaptchaVerifier (visible)...");

            // Use VISIBLE reCAPTCHA for reliability with real SMS
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-box", {
                size: "normal",
                callback: (token) => {
                    console.log("✅ reCAPTCHA solved! Token:", token?.substring(0, 30) + "...");
                    setRecaptchaReady(true);
                    setMessage("✅ reCAPTCHA verified! Now click Send OTP.");
                },
                "expired-callback": () => {
                    console.log("⚠️ reCAPTCHA expired, re-rendering...");
                    setRecaptchaReady(false);
                    setMessage("reCAPTCHA expired. Please solve it again.");
                }
            });

            const widgetId = await window.recaptchaVerifier.render();
            console.log("✅ reCAPTCHA rendered, widgetId:", widgetId);
            setMessage("Solve the reCAPTCHA below, then click Send OTP.");
        } catch (err) {
            console.error("reCAPTCHA setup error:", err);
            setMessage(`reCAPTCHA error: ${err.message}`);
        }
    };

    const handleSendOTP = async () => {
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            setMessage("Enter a valid 10-digit Indian mobile number");
            return;
        }

        if (!window.recaptchaVerifier) {
            setMessage("reCAPTCHA not ready. Refresh and try again.");
            return;
        }

        setStatus("sending");
        setMessage("Sending OTP...");

        try {
            const phoneNumber = `+91${mobile}`;
            console.log("Calling signInWithPhoneNumber:", phoneNumber);

            const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);

            console.log("✅ OTP sent successfully!");
            setConfirmResult(result);
            window.confirmationResult = result;
            setStatus("sent");
            setMessage(`✅ Real SMS OTP sent to ${phoneNumber}! Check your phone.`);
        } catch (err) {
            console.error("❌ Send OTP failed:", err.code, err.message);
            setStatus("error");

            let msg = err.message;
            if (err.code === "auth/invalid-app-credential") {
                msg = "reCAPTCHA Enterprise API not enabled! Go to Google Cloud Console → APIs → Enable 'reCAPTCHA Enterprise API'";
            } else if (err.code === "auth/too-many-requests") {
                msg = "Too many requests. Wait a few minutes and try again.";
            } else if (err.code === "auth/invalid-phone-number") {
                msg = "Invalid phone number format.";
            } else if (err.code === "auth/quota-exceeded") {
                msg = "SMS quota exceeded. Check Firebase billing.";
            }

            setMessage(`Error: ${msg} (${err.code})`);

            // Re-init recaptcha after error
            setTimeout(() => initRecaptcha(), 1000);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setMessage("Enter 6-digit OTP");
            return;
        }

        const confirmation = confirmResult || window.confirmationResult;
        if (!confirmation) {
            setMessage("No OTP session. Send OTP first.");
            return;
        }

        setStatus("verifying");
        setMessage("Verifying...");

        try {
            const result = await confirmation.confirm(otp);
            const idToken = await result.user.getIdToken();

            console.log("✅ OTP Verified!");
            console.log("User UID:", result.user.uid);
            console.log("Phone:", result.user.phoneNumber);
            console.log("ID Token:", idToken.substring(0, 50) + "...");

            setStatus("verified");
            setMessage(`✅ Verified! UID: ${result.user.uid} | Phone: ${result.user.phoneNumber}`);
        } catch (err) {
            console.error("❌ Verify failed:", err.code, err.message);
            setStatus("error");
            setMessage(`Verification failed: ${err.message} (${err.code})`);
        }
    };

    const resetAll = () => {
        setStatus("idle");
        setMobile("");
        setOtp("");
        setMessage("");
        setConfirmResult(null);
        setRecaptchaReady(false);
        window.confirmationResult = null;
        setTimeout(() => initRecaptcha(), 300);
    };

    return (
        <div style={{ maxWidth: 420, margin: "40px auto", padding: 24, fontFamily: "system-ui, Arial", background: "#fff", borderRadius: 12, boxShadow: "0 2px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 5px" }}>🔥 Firebase Real SMS OTP Test</h2>
            <p style={{ fontSize: "0.8rem", color: "#888", margin: "0 0 20px" }}>
                Domain: {window.location.hostname} | Project: {auth.app.options.projectId}
            </p>

            {/* STEP 1: Enter number */}
            {(status === "idle" || status === "sending" || status === "error") && (
                <>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.9rem" }}>Mobile Number</label>
                        <div style={{ display: "flex", gap: 6 }}>
                            <span style={{ padding: "10px 12px", background: "#f1f5f9", borderRadius: 6, fontWeight: 600 }}>+91</span>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="8310261838"
                                style={{ flex: 1, padding: 10, fontSize: "1rem", border: "1px solid #ddd", borderRadius: 6, outline: "none" }}
                            />
                        </div>
                    </div>

                    {/* reCAPTCHA renders HERE - user must solve it */}
                    <div id="recaptcha-box" style={{ margin: "15px 0", minHeight: 78 }}></div>

                    <button
                        onClick={handleSendOTP}
                        disabled={status === "sending" || !mobile || mobile.length !== 10}
                        style={{
                            width: "100%", padding: 14, fontSize: "1rem", fontWeight: 700,
                            background: status === "sending" ? "#94a3b8" : "#ef4444",
                            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                            opacity: (!mobile || mobile.length !== 10) ? 0.5 : 1
                        }}
                    >
                        {status === "sending" ? "⏳ Sending..." : "📲 Send OTP"}
                    </button>
                </>
            )}

            {/* STEP 2: Enter OTP */}
            {(status === "sent" || status === "verifying") && (
                <>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.9rem" }}>Enter 6-Digit OTP</label>
                        <input
                            type="tel"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            maxLength={6}
                            autoFocus
                            style={{ width: "100%", padding: 14, fontSize: "1.8rem", letterSpacing: 12, textAlign: "center", border: "2px solid #059669", borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                        />
                    </div>

                    <button
                        onClick={handleVerifyOTP}
                        disabled={status === "verifying" || otp.length !== 6}
                        style={{
                            width: "100%", padding: 14, fontSize: "1rem", fontWeight: 700,
                            background: "#059669", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                            opacity: otp.length !== 6 ? 0.5 : 1
                        }}
                    >
                        {status === "verifying" ? "⏳ Verifying..." : "✅ Verify OTP"}
                    </button>
                </>
            )}

            {/* Success state */}
            {status === "verified" && (
                <button
                    onClick={resetAll}
                    style={{ width: "100%", padding: 14, fontSize: "1rem", fontWeight: 700, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
                >
                    🔄 Test Again
                </button>
            )}

            {/* Status message */}
            {message && (
                <div style={{
                    marginTop: 16, padding: 14, borderRadius: 8, fontSize: "0.9rem", lineHeight: 1.5, wordBreak: "break-word",
                    background: message.includes("✅") ? "#dcfce7" : message.includes("Error") ? "#fee2e2" : "#f0f9ff",
                    color: message.includes("✅") ? "#166534" : message.includes("Error") ? "#991b1b" : "#0c4a6e",
                    border: `1px solid ${message.includes("✅") ? "#86efac" : message.includes("Error") ? "#fca5a5" : "#7dd3fc"}`
                }}>
                    {message}
                </div>
            )}

            {/* Debug */}
            <div style={{ marginTop: 16, padding: 10, background: "#f8fafc", borderRadius: 6, fontSize: "0.75rem", color: "#64748b" }}>
                <strong>Debug:</strong> Status={status} | reCAPTCHA={recaptchaReady ? "✅" : "❌"} | Confirm={confirmResult ? "✅" : "❌"}
            </div>
        </div>
    );
};

export default TestOTP;
