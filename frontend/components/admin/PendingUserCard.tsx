"use client";

interface DocumentType {
    path: string;
    status: string;
    rejectionReason: string;
}

interface UserType {
    _id: string;
    fullName: string;
    email: string;
    role: string;

    documents: {
        aadhaar: DocumentType;
        drivingLicense: DocumentType;
        gstCertificate: DocumentType;
        shopLicense: DocumentType;
    };
}

interface PendingUserCardProps {
    user: UserType;
    onApprove: () => void;
    onReject: () => void;
    onDocumentUpdate: (
        documentName:
            | "aadhaar"
            | "drivingLicense"
            | "gstCertificate"
            | "shopLicense",
        status: "approved" | "rejected"
    ) => void;
}

export default function PendingUserCard({
    user,
    onApprove,
    onReject,
    onDocumentUpdate,
}: PendingUserCardProps) {
    const uploadedDocs = [
        user.documents.aadhaar,
        user.documents.drivingLicense,
        user.documents.gstCertificate,
        user.documents.shopLicense,
    ].filter((doc) => doc.path);

    const allReviewed = uploadedDocs.every(
        (doc) =>
            doc.status === "approved" ||
            doc.status === "rejected"
    );

    function renderStatus(document: DocumentType) {
        if (document.status === "pending") {
            return (
                <div className="text-yellow-400 font-semibold mt-3">
                    ⏳ Pending Review
                </div>
            );
        }

        if (document.status === "approved") {
            return (
                <div className="text-green-500 font-semibold mt-3">
                    ✅ Approved
                </div>
            );
        }

        return (
            <>
                <div className="text-red-500 font-semibold mt-3">
                    ❌ Rejected
                </div>

                {document.rejectionReason && (
                    <div className="text-gray-400 text-sm mt-2">
                        Reason: {document.rejectionReason}
                    </div>
                )}
            </>
        );
    }

    function renderDocument(
        title: string,
        documentName:
            | "aadhaar"
            | "drivingLicense"
            | "gstCertificate"
            | "shopLicense",
        document: DocumentType
    ) {
        if (!document.path) return null;

        return (
            <div className="rounded-2xl border border-[#27272A] p-4">
                <h3 className="text-gray-300 mb-3 font-semibold">
                    {title}
                </h3>

                <img
                    src={document.path}
                    className="rounded-2xl border border-[#27272A] h-56 w-full object-cover"
                />

                {renderStatus(document)}

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() =>
                            onDocumentUpdate(documentName, "approved")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl py-2 font-semibold"
                    >
                        Approve
                    </button>

                    <button
                        onClick={() =>
                            onDocumentUpdate(documentName, "rejected")
                        }
                        className="flex-1 bg-red-700 hover:bg-red-800 rounded-xl py-2 font-semibold"
                    >
                        Reject
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-6 shadow-xl">

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">
                    {user.fullName}
                </h1>

                <p className="text-gray-400 mt-2">
                    {user.email}
                </p>

                <div className="mt-3 inline-flex rounded-xl bg-[#7F1D1D]/20 px-4 py-2 text-[#F87171]">
                    {user.role}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

                {renderDocument(
                    "GST Certificate",
                    "gstCertificate",
                    user.documents.gstCertificate
                )}

                {renderDocument(
                    "Shop License",
                    "shopLicense",
                    user.documents.shopLicense
                )}

                {renderDocument(
                    "Aadhaar Card",
                    "aadhaar",
                    user.documents.aadhaar
                )}

                {renderDocument(
                    "Driving License",
                    "drivingLicense",
                    user.documents.drivingLicense
                )}

            </div>

            {!allReviewed && (
                <div className="mt-8 text-yellow-400 font-semibold text-center">
                    ⚠ Review all uploaded documents first
                </div>
            )}

            <div className="flex gap-4 mt-8">

                <button
                    disabled={!allReviewed}
                    onClick={onApprove}
                    className={`flex-1 rounded-2xl py-4 font-semibold text-white ${allReviewed
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-700 cursor-not-allowed"
                        }`}
                >
                    Approve User
                </button>

                <button
                    disabled={!allReviewed}
                    onClick={onReject}
                    className={`flex-1 rounded-2xl py-4 font-semibold text-white ${allReviewed
                            ? "bg-red-700 hover:bg-red-800"
                            : "bg-gray-700 cursor-not-allowed"
                        }`}
                >
                    Reject User
                </button>

            </div>

        </div>
    );
}