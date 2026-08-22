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
    <div className="bg-[#111111] border border-neutral-900 rounded-3xl p-7 hover:border-[#7F1D1D]/60 transition-all duration-300 shadow-xl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white">{user.fullName}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#7F1D1D]/20 border border-[#7F1D1D]/40 text-[#F87171] text-xs font-semibold">
              {user.role}
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1">{user.email}</p>
          {user.businessName && (
            <p className="text-neutral-500 text-xs mt-1">
              Business: <span className="text-neutral-300">{user.businessName}</span>
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
        <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
          Submitted KYC Documents ({uploadedDocsList.length})
        </h4>

        {uploadedDocsList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 text-center">
            <FileText className="mx-auto text-neutral-600 mb-2" size={32} />
            <p className="text-neutral-400 text-sm">
              No verification documents attached during registration.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {uploadedDocsList.map(({ key, title, doc }) => (
              <div
                key={key}
                className="bg-[#16131A] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-white text-sm">{title}</h5>

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
                  <div className="relative group rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 h-44 mb-3 flex items-center justify-center">
                    <img
                      src={doc.path}
                      alt={title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: doc.path, title })}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-[#7F1D1D] text-white text-xs font-medium rounded-xl border border-neutral-700 flex items-center gap-1.5 transition"
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#111111] hover:bg-[#7F1D1D] text-white text-xs font-medium rounded-xl border border-neutral-700 flex items-center gap-1.5 transition"
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
                <div className="flex gap-2 pt-2 border-t border-neutral-800/80">
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
      <div className="mt-8 pt-6 border-t border-neutral-900">
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
            className="flex-1 py-3.5 px-6 rounded-2xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(127,29,29,0.3)]"
          >
            <XCircle size={18} />
            <span>Reject Registration</span>
          </button>
        </div>
      </div>

      {/* Modal: Document Rejection Reason */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-lg">
                Reject {activeDocModal.title}
              </h3>
              <button
                onClick={() => setActiveDocModal(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectDocSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Rejection Reason for Document
                </label>
                <textarea
                  value={docRejectionReason}
                  onChange={(e) => setDocRejectionReason(e.target.value)}
                  placeholder="e.g. Blurry scan, name mismatch, expired document..."
                  required
                  rows={3}
                  className="w-full bg-[#16131A] border border-neutral-800 rounded-2xl p-3.5 text-white text-sm outline-none focus:border-[#7F1D1D]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveDocModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!docRejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
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
          <div className="bg-[#111111] border border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-lg">
                Reject Registration for {user.fullName}
              </h3>
              <button
                onClick={() => setIsRejectUserModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Overall Rejection Reason
                </label>
                <textarea
                  value={userRejectionReason}
                  onChange={(e) => setUserRejectionReason(e.target.value)}
                  placeholder="Explain why this account registration is being rejected..."
                  required
                  rows={4}
                  className="w-full bg-[#16131A] border border-neutral-800 rounded-2xl p-3.5 text-white text-sm outline-none focus:border-[#7F1D1D]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!userRejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="relative max-w-3xl w-full bg-[#111111] border border-neutral-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white">{previewImage.title}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-neutral-400 hover:text-white p-1"
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