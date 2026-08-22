"use client";

import { useState } from "react";
import { XCircle, Eye, ExternalLink, X, AlertOctagon } from "lucide-react";
import type { AdminUser, AdminDocument } from "@/lib/api";

export default function RejectedUserCard({ user }: { user: AdminUser }) {
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const docs = user.documents || ({} as AdminUser["documents"]);

  const uploadedDocsList: Array<{
    key: string;
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

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-7 hover:border-red-900/50 transition-all duration-300 shadow-xl">
      {/* User Header */}
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

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            <XCircle size={14} />
            Registration Rejected
          </span>
        </div>
      </div>

      {/* Rejection Reason Box (Semantic Red) */}
      {user.applicationRejectionReason && (
        <div className="mt-5 p-4 rounded-2xl bg-red-950/30 border border-red-800/40">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
            <AlertOctagon size={15} />
            <span>Official Rejection Reason</span>
          </div>
          <p className="text-neutral-200 text-sm mt-2 leading-relaxed">
            {user.applicationRejectionReason}
          </p>
        </div>
      )}

      {/* Documents Status */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">
          Submitted Documents ({uploadedDocsList.length})
        </h4>

        {uploadedDocsList.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#111214] border border-[#2A2B30] text-center text-xs text-[#A1A1AA]">
            No document attachments on record.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {uploadedDocsList.map(({ key, title, doc }) => (
              <div
                key={key}
                className="bg-[#111214] border border-[#2A2B30] rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-[#F4F4F5] text-xs">{title}</h5>
                    {doc.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">
                        <XCircle size={11} />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">
                        Passed
                      </span>
                    )}
                  </div>

                  <div className="relative group rounded-xl overflow-hidden bg-black/40 border border-[#2A2B30] h-36 mb-2 flex items-center justify-center">
                    <img
                      src={doc.path}
                      alt={title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: doc.path, title })}
                        className="px-2.5 py-1 bg-[#1A1B1E] hover:bg-[#F97316] text-white text-xs rounded-lg border border-[#2A2B30] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#1A1B1E] hover:bg-[#F97316] text-white text-xs rounded-lg border border-[#2A2B30] flex items-center gap-1 transition"
                      >
                        <ExternalLink size={12} />
                        Open
                      </a>
                    </div>
                  </div>

                  {doc.status === "rejected" && doc.rejectionReason && (
                    <p className="text-xs text-red-400/90 mt-1">
                      <span className="font-semibold">Reason: </span>
                      {doc.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
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