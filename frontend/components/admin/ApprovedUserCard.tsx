"use client";

interface DocumentType {
    path: string;
    status: string;
    rejectionReason: string;
}

interface UserType {
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

export default function ApprovedUserCard({
    user,
}: {
    user: UserType;
}) {
    function renderDocument(title: string, document: DocumentType) {
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

                <div className="text-green-500 font-semibold mt-3">
                    ✅ Approved
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-6 mb-8">

            <h1 className="text-2xl font-bold">{user.fullName}</h1>

            <p className="text-gray-400 mt-2">
                {user.email}
            </p>

            <div className="mt-3 inline-flex rounded-xl bg-[#7F1D1D]/20 px-4 py-2 text-[#F87171]">
                {user.role}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">

                {renderDocument(
                    "GST Certificate",
                    user.documents.gstCertificate
                )}

                {renderDocument(
                    "Shop License",
                    user.documents.shopLicense
                )}

                {renderDocument(
                    "Aadhaar Card",
                    user.documents.aadhaar
                )}

                {renderDocument(
                    "Driving License",
                    user.documents.drivingLicense
                )}

            </div>
        </div>
    );
}