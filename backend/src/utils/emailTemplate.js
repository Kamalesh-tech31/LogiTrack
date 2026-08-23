/**
 * LogiTrack Email Design System
 * 
 * Consistent, email-client-safe HTML templates matching the LogiTrack web application design:
 * - Dark background (#0B0C0E / #111214)
 * - Charcoal card container (#1A1B1E) with subtle border (#2A2B30)
 * - LogiTrack Orange (#F97316) accent colors
 * - Modern typography, rounded buttons, monospace OTP pills, and structured status cards
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Base email layout wrapper with cross-client table layout.
 */
function renderBaseEmailTemplate({
  badgeText = "",
  badgeType = "primary", // "primary" | "success" | "danger" | "warning"
  title,
  subtitle = "",
  contentHtml,
  ctaText = "",
  ctaUrl = "",
  footerNote = "This is an automated operational notification from the LogiTrack logistics dispatch system.",
}) {
  const badgeStyles = {
    primary: "background-color: rgba(249, 115, 22, 0.12); color: #F97316; border: 1px solid rgba(249, 115, 22, 0.35);",
    success: "background-color: rgba(34, 197, 94, 0.12); color: #22C55E; border: 1px solid rgba(34, 197, 94, 0.35);",
    danger: "background-color: rgba(239, 68, 68, 0.12); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.35);",
    warning: "background-color: rgba(245, 158, 11, 0.12); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.35);",
  };

  const badgeHtml = badgeText
    ? `<tr>
        <td align="center" style="padding-bottom: 16px;">
          <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; ${badgeStyles[badgeType] || badgeStyles.primary}">
            ${badgeText}
          </span>
        </td>
      </tr>`
    : "";

  const ctaButtonHtml = ctaText && ctaUrl
    ? `<tr>
        <td align="center" style="padding-top: 28px; padding-bottom: 8px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 14px; background-color: #F97316;">
                <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);">
                  ${ctaText} &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "LogiTrack Notification"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0C0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #F4F4F5;">
  
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0B0C0E; min-height: 100vh; padding: 36px 16px;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Main Email Container (Max Width 580px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #1A1B1E; border: 1px solid #2A2B30; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Branding Bar -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; border-bottom: 1px solid #242529;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Logi<span style="color: #F97316;">Track</span>
                    </div>
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: #A1A1AA; margin-top: 4px;">
                      Smart Logistics & Fleet Operations
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content Area -->
          <tr>
            <td style="padding: 32px 36px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                
                ${badgeHtml}

                <!-- Title & Subtitle -->
                ${
                  title
                    ? `<tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1.25;">
                            ${title}
                          </h1>
                          ${
                            subtitle
                              ? `<p style="margin: 6px 0 0; font-size: 13px; color: #A1A1AA; line-height: 1.5;">
                                  ${subtitle}
                                </p>`
                              : ""
                          }
                        </td>
                      </tr>`
                    : ""
                }

                <!-- Dynamic Injected Body -->
                <tr>
                  <td style="padding-top: 8px; font-size: 14px; line-height: 1.6; color: #D4D4D8;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- Optional Call-to-Action Button -->
                ${ctaButtonHtml}

              </table>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 24px 36px 32px; background-color: #141517; border-top: 1px solid #242529; text-align: center;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-size: 12px; color: #71717A; line-height: 1.5;">
                    <p style="margin: 0 0 6px; color: #A1A1AA; font-weight: 600;">
                      LogiTrack Enterprise Platform
                    </p>
                    <p style="margin: 0 0 8px;">
                      ${footerNote}
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #52525B;">
                      &copy; ${new Date().getFullYear()} LogiTrack Inc. All rights reserved. &bull; Secure Dispatch Network
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 1. Registration OTP Email Template
 */
function buildRegistrationOtpEmail(otp, expiryMinutes = 5) {
  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #D4D4D8;">
        Use the single-use passcode below to verify your email address and complete your LogiTrack account setup.
      </p>
    </div>

    <!-- OTP Display Box -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
      <tr>
        <td align="center">
          <div style="background-color: #111214; border: 1px solid #F97316; border-radius: 18px; padding: 22px 24px; text-align: center; box-shadow: 0 0 25px rgba(249, 115, 22, 0.12);">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #F97316; margin-bottom: 8px;">
              Verification Passcode
            </div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 0.35em; color: #FFFFFF; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              ${otp}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <div style="background-color: #111214; border: 1px solid #2A2B30; border-radius: 14px; padding: 14px 18px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
        ⏱️ This security code expires in <strong style="color: #FFFFFF;">${expiryMinutes} minutes</strong> and can only be used once. If you did not initiate this request, you can safely ignore this email.
      </p>
    </div>
  `;

  return renderBaseEmailTemplate({
    badgeText: "Security Verification",
    badgeType: "primary",
    title: "Verify Your Email Address",
    subtitle: "Complete your LogiTrack platform onboarding",
    contentHtml,
    footerNote: "Do not share this code with anyone. LogiTrack administrators will never ask for your verification passcode.",
  });
}

/**
 * 2. Delivery Doorstep Verification OTP Email Template
 */
function buildDeliveryOtpEmail(otp, orderId, expiryMinutes = 30) {
  const contentHtml = `
    <div style="text-align: center; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 15px; color: #FFFFFF; font-weight: 600;">
        Your package for Order <span style="color: #F97316;">#${orderId}</span> is out for delivery!
      </p>
      <p style="margin: 0; font-size: 13px; color: #A1A1AA;">
        To ensure secure handoff, provide the passcode below to your delivery agent upon arrival:
      </p>
    </div>

    <!-- Passcode Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
      <tr>
        <td align="center">
          <div style="background-color: #111214; border: 1px solid #F97316; border-radius: 18px; padding: 22px 24px; text-align: center; box-shadow: 0 0 25px rgba(249, 115, 22, 0.15);">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #FDBA74; margin-bottom: 8px;">
              Doorstep Handoff OTP
            </div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 0.35em; color: #FFFFFF;">
              ${otp}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <div style="background-color: #111214; border: 1px solid #2A2B30; border-radius: 14px; padding: 14px 18px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size: 12px; color: #A1A1AA; line-height: 1.6;">
            &bull; <strong style="color: #FFFFFF;">Order:</strong> #${orderId}<br>
            &bull; <strong style="color: #FFFFFF;">Validity:</strong> ${expiryMinutes} minutes<br>
            &bull; <strong style="color: #FFFFFF;">Handover:</strong> Disclose only upon inspecting your physical parcel at your doorstep.
          </td>
        </tr>
      </table>
    </div>
  `;

  return renderBaseEmailTemplate({
    badgeText: "Delivery Handoff",
    badgeType: "primary",
    title: "Delivery Verification Code",
    subtitle: `Order #${orderId} &bull; Live Dispatch Telemetry`,
    contentHtml,
    ctaText: "Track Live Delivery",
    ctaUrl: `${FRONTEND_URL}/customer/tracking?orderId=${orderId}`,
    footerNote: "This code serves as your digital signature to confirm successful parcel handover.",
  });
}

/**
 * 3. Admin Account Approved Email Template
 */
function buildAccountApprovedEmail(user) {
  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 14px; font-size: 15px; color: #FFFFFF;">
        Dear <strong>${user.fullName || "User"}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #D4D4D8; line-height: 1.6;">
        Great news! Your LogiTrack application and KYC verification documents have been <strong style="color: #22C55E;">reviewed and approved</strong> by our compliance administration team.
      </p>
    </div>

    <!-- Account Details Table -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #111214; border: 1px solid #2A2B30; border-radius: 16px; margin: 0 0 20px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #1E2024; font-size: 12px; color: #A1A1AA;">
          <strong style="color: #FFFFFF; font-size: 13px;">Authorized Account Profile</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #D4D4D8;">
          <table role="presentation" width="100%" border="0" cellpadding="4" cellspacing="0">
            <tr>
              <td width="35%" style="color: #A1A1AA; font-size: 12px;">Registered Role:</td>
              <td style="color: #FFFFFF; font-weight: 600;">${user.role || "Enterprise Partner"}</td>
            </tr>
            <tr>
              <td style="color: #A1A1AA; font-size: 12px;">Account Email:</td>
              <td style="color: #FFFFFF; font-weight: 600;">${user.email}</td>
            </tr>
            <tr>
              <td style="color: #A1A1AA; font-size: 12px;">KYC Status:</td>
              <td style="color: #22C55E; font-weight: 700;">Verified &amp; Active</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px; font-size: 13px; color: #A1A1AA; text-align: center;">
      You now have full access to the LogiTrack operations portal, live order pipelines, and dashboard management tools.
    </p>
  `;

  return renderBaseEmailTemplate({
    badgeText: "Account Approved",
    badgeType: "success",
    title: "Welcome to LogiTrack Fleet",
    subtitle: "Your credentials and compliance documents are verified",
    contentHtml,
    ctaText: "Log In to Your Dashboard",
    ctaUrl: `${FRONTEND_URL}/login`,
    footerNote: "If you have any questions or require dispatch assistance, reach out through the admin portal.",
  });
}

/**
 * 4. Admin Account Rejected Email Template
 */
function buildAccountRejectedEmail(user, rejectionReason) {
  const docs = user.documents || {};

  const docRows = [];
  
  if (docs.gstCertificate?.path) {
    docRows.push({
      name: "GST Certificate",
      status: docs.gstCertificate.status || "pending",
      reason: docs.gstCertificate.rejectionReason,
    });
  }
  if (docs.shopLicense?.path) {
    docRows.push({
      name: "Shop License",
      status: docs.shopLicense.status || "pending",
      reason: docs.shopLicense.rejectionReason,
    });
  }
  if (docs.aadhaar?.path) {
    docRows.push({
      name: "Aadhaar Card",
      status: docs.aadhaar.status || "pending",
      reason: docs.aadhaar.rejectionReason,
    });
  }
  if (docs.drivingLicense?.path) {
    docRows.push({
      name: "Driving License",
      status: docs.drivingLicense.status || "pending",
      reason: docs.drivingLicense.rejectionReason,
    });
  }

  const documentItemsHtml = docRows.length > 0
    ? docRows.map((doc) => {
        const isRejected = doc.status === "rejected";
        return `
          <div style="background-color: #141517; border: 1px solid ${isRejected ? "rgba(239, 68, 68, 0.4)" : "#2A2B30"}; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-weight: 600; color: #FFFFFF; font-size: 13px;">${doc.name}</td>
                <td align="right" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${isRejected ? "#EF4444" : "#22C55E"};">
                  ${doc.status}
                </td>
              </tr>
              ${
                doc.reason
                  ? `<tr>
                      <td colspan="2" style="font-size: 12px; color: #EF4444; padding-top: 6px; margin-top: 4px; border-top: 1px solid rgba(239, 68, 68, 0.2);">
                        Reason: ${doc.reason}
                      </td>
                    </tr>`
                  : ""
              }
            </table>
          </div>
        `;
      }).join("")
    : "";

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 0 0 12px; font-size: 15px; color: #FFFFFF;">
        Dear <strong>${user.fullName || "User"}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #D4D4D8; line-height: 1.6;">
        Thank you for your interest in joining LogiTrack. After reviewing your submission, our verification team was unable to approve your application at this time.
      </p>
    </div>

    <!-- Main Rejection Notice Box -->
    <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 18px 20px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #EF4444; margin-bottom: 6px;">
        Primary Rejection Feedback
      </div>
      <div style="font-size: 14px; color: #FFFFFF; font-weight: 500; line-height: 1.5;">
        ${rejectionReason || user.applicationRejectionReason || "Verification criteria not met. Please review your submitted documentation."}
      </div>
    </div>

    ${
      documentItemsHtml
        ? `<div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #A1A1AA; margin-bottom: 10px;">
              Document Review Breakdown
            </div>
            ${documentItemsHtml}
          </div>`
        : ""
    }

    <p style="margin: 0 0 12px; font-size: 13px; color: #A1A1AA; line-height: 1.6;">
      You are welcome to register again with updated, clear, and valid documents to complete verification.
    </p>
  `;

  return renderBaseEmailTemplate({
    badgeText: "Action Required",
    badgeType: "danger",
    title: "Application Status Update",
    subtitle: "Verification review results for your LogiTrack account",
    contentHtml,
    ctaText: "Review & Re-apply",
    ctaUrl: `${FRONTEND_URL}/register`,
    footerNote: "If you believe this determination was made in error, please contact compliance support.",
  });
}

/**
 * 5. Password Reset Email Template
 */
function buildPasswordResetEmail(user, resetUrl, expiryMinutes = 30) {
  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 12px; font-size: 15px; color: #FFFFFF;">
        Hello <strong>${user.fullName || "User"}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #D4D4D8; line-height: 1.6;">
        We received a request to reset your LogiTrack account password. Click the secure link below to choose a new password:
      </p>
    </div>

    <div style="background-color: #111214; border: 1px solid #2A2B30; border-radius: 14px; padding: 14px 18px; margin-bottom: 8px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
        🔒 This password reset link is valid for <strong style="color: #FFFFFF;">${expiryMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  return renderBaseEmailTemplate({
    badgeText: "Account Security",
    badgeType: "warning",
    title: "Reset Your Password",
    subtitle: "Secure password reset request for LogiTrack",
    contentHtml,
    ctaText: "Reset Password",
    ctaUrl: resetUrl,
    footerNote: "LogiTrack takes your security seriously. Never forward or share password reset links.",
  });
}

module.exports = {
  renderBaseEmailTemplate,
  buildRegistrationOtpEmail,
  buildDeliveryOtpEmail,
  buildAccountApprovedEmail,
  buildAccountRejectedEmail,
  buildPasswordResetEmail,
};
