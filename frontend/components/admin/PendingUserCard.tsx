"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  ExternalLink,
  FileText,
  AlertTriangle,
  Eye,
  X,
  Send,
} from "lucide-react";
import type { AdminUser, AdminDocument } from "@/lib/api";

interface PendingUserCardProps {
  user: AdminUser;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onDocumentUpdate: (
    documentName: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense",
    status: "approved" | "rejected",
    reason?: string
  ) => Promise<void>;
}

export default function PendingUserCard({
  user,
  onApprove,
  onReject,
  onDocumentUpdate,
}: PendingUserCardProps) {
  // Modal states
  const [activeDocModal, setActiveDocModal] = useState<{
    key: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense";
    title: string;
  } | null>(null);
  const [docRejectionReason, setDocRejectionReason] = useState("");

  const [isRejectUserModalOpen, setIsRejectUserModalOpen] = useState(false);
  const [userRejectionReason, setUserRejectionReason] = useState("");

  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const docs = user.documents || ({} as AdminUser["documents"]);

  const uploadedDocsList: Array<{
    key: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense";
    title: string;
    doc: AdminDocument;
  }> = [];

  if (docs.gstCertificate?.path) {
    uploadedDocsList.push({
      key: "gstCertificate",
      title: "GST Certificate",
      doc: docs.gstCertificate,
    });
  }
  if (docs.shopLicense?.path) {
    uploadedDocsList.push({
      key: "shopLicense",
      title: "Shop License",
      doc: docs.shopLicense,
    });
  }
  if (docs.aadhaar?.path) {
    uploadedDocsList.push({
      key: "aadhaar",
      title: "Aadhaar Card",
      doc: docs.aadhaar,
    });
  }
  if (docs.drivingLicense?.path) {
    uploadedDocsList.push({
      key: "drivingLicense",
      title: "Driving License",
      doc: docs.drivingLicense,
    });
  }

  // Check if all uploaded documents are reviewed
  const allReviewed =
    uploadedDocsList.length > 0 &&
    uploadedDocsList.every(
      (item) => item.doc.status === "approved" || item.doc.status === "rejected"
    );

  const handleApproveDoc = async (
    key: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense"
  ) => {
    setIsProcessing(true);
    try {
      await onDocumentUpdate(key, "approved");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocModal || !docRejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      await onDocumentUpdate(
        activeDocModal.key,
        "rejected",
        docRejectionReason.trim()
      );
      setActiveDocModal(null);
      setDocRejectionReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      await onReject(userRejectionReason.trim());
      setIsRejectUserModalOpen(false);
      setUserRejectionReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-7 hover:border-[#F97316]/50 transition-all duration-300 shadow-xl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2A2B30]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-[#F4F4F5]">{user.fullName}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#FDBA74] text-xs font-semibold">
              {user.role}
            </span>
          </div>
          <p className="text-[#A1A1AA] text-sm mt-1">{user.email}</p>
          {user.businessName && (
            <p className="text-[#A1A1AA] text-xs mt-1">
              Business: <span className="text-[#F4F4F5]">{user.businessName}</span>
              {user.gstNumber && ` | GST: ${user.gstNumber}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
            <Clock3 size={14} />
            Pending Verification
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">
          Submitted KYC Documents ({uploadedDocsList.length})
        </h4>

        {uploadedDocsList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#111214] border border-[#2A2B30] text-center">
            <FileText className="mx-auto text-[#A1A1AA] mb-2" size={32} />
            <p className="text-[#A1A1AA] text-sm">
              No verification documents attached during registration.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {uploadedDocsList.map(({ key, title, doc }) => (
              <div
                key={key}
                className="bg-[#111214] border border-[#2A2B30] rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-[#F4F4F5] text-sm">{title}</h5>

                    {/* Status Badge */}
                    {doc.status === "approved" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 size={13} />
                        Approved
                      </span>
                    )}
                    {doc.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-xl">
                        <XCircle size={13} />
                        Rejected
                      </span>
                    )}
                    {doc.status === "pending" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-xl">
                        <Clock3 size={13} />
                        Needs Review
                      </span>
                    )}
                  </div>

                  {/* Document Preview Thumbnail */}
                  <div className="relative group rounded-xl overflow-hidden bg-black/40 border border-[#2A2B30] h-44 mb-3 flex items-center justify-center">
                    <img
                      src={doc.path}
                      alt={title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: doc.path, title })}
                        className="px-3 py-1.5 bg-[#1A1B1E] hover:bg-[#F97316] text-white text-xs font-medium rounded-xl border border-[#2A2B30] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#1A1B1E] hover:bg-[#F97316] text-white text-xs font-medium rounded-xl border border-[#2A2B30] flex items-center gap-1.5 transition"
                      >
                        <ExternalLink size={14} />
                        Open
                      </a>
                    </div>
                  </div>

                  {doc.status === "rejected" && doc.rejectionReason && (
                    <div className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
                      <span className="font-semibold text-red-400">Reason: </span>
                      {doc.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Document Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-[#2A2B30]/60">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApproveDoc(key)}
                    className="flex-1 py-2 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/40 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setActiveDocModal({ key, title });
                      setDocRejectionReason("");
                    }}
                    className="flex-1 py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/40 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Review Status / Action Gate */}
      <div className="mt-8 pt-6 border-t border-[#2A2B30]">
        {!allReviewed && uploadedDocsList.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium mb-5 text-center">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Please review all submitted KYC documents before making a final registration decision.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            disabled={!allReviewed || isProcessing}
            onClick={onApprove}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            <CheckCircle2 size={18} />
            <span>Approve & Grant Access</span>
          </button>

          <button
            type="button"
            disabled={!allReviewed || isProcessing}
            onClick={() => {
              setIsRejectUserModalOpen(true);
              setUserRejectionReason("");
            }}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            <XCircle size={18} />
            <span>Reject Registration</span>
          </button>
        </div>
      </div>

      {/* Modal: Document Rejection Reason */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A2B30]">
              <h3 className="font-bold text-[#F4F4F5] text-lg">
                Reject {activeDocModal.title}
              </h3>
              <button
                onClick={() => setActiveDocModal(null)}
                className="text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectDocSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-2">
                  Rejection Reason for Document
                </label>
                <textarea
                  value={docRejectionReason}
                  onChange={(e) => setDocRejectionReason(e.target.value)}
                  placeholder="e.g. Blurry scan, name mismatch, expired document..."
                  required
                  rows={3}
                  className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl p-3.5 text-[#F4F4F5] text-sm outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveDocModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[#A1A1AA] text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!docRejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Main User Rejection Reason */}
      {isRejectUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A2B30]">
              <h3 className="font-bold text-[#F4F4F5] text-lg">
                Reject Registration for {user.fullName}
              </h3>
              <button
                onClick={() => setIsRejectUserModalOpen(false)}
                className="text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-2">
                  Overall Rejection Reason
                </label>
                <textarea
                  value={userRejectionReason}
                  onChange={(e) => setUserRejectionReason(e.target.value)}
                  placeholder="Explain why this account registration is being rejected..."
                  required
                  rows={4}
                  className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl p-3.5 text-[#F4F4F5] text-sm outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[#A1A1AA] text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!userRejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} />
                  <span>Reject Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Preview Image */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="relative max-w-3xl w-full bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A2B30]">
              <h3 className="font-bold text-[#F4F4F5]">{previewImage.title}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}