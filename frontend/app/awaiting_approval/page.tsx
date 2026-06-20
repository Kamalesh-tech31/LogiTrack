"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentType {
    path: string;
    status: string;
    rejectionReason: string;
}

interface UserData {
    status: string;

    documents: {
        aadhaar: DocumentType;
        drivingLicense: DocumentType;
        gstCertificate: DocumentType;
        shopLicense: DocumentType;
    };
}

export default function AwaitingApprovalPage() {
    const router = useRouter();

    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {

        async function fetchStatus() {
            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    router.push("/login");
                    return;
                }
                console.log("TOKEN:", token);

                const response = await fetch(
                    "http://localhost:5000/api/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("STATUS:", response.status);

                const data = await response.json();

                console.log(data);

                if (!data.success) return;

                setUserData(data.data);

                if (data.data.status === "approved") {

                    setTimeout(() => {
                        localStorage.removeItem("token");
                        router.push("/login");
                    }, 3000);
                }

                if (data.data.status === "rejected") {

                    setTimeout(() => {
                        localStorage.removeItem("token");
                        router.push("/login");
                    }, 3000);
                }

            } catch (error) {
                console.log(error);
            }
        }

        fetchStatus();

        const interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);

    }, [router]);

    function renderDocument(
        title: string,
        document: DocumentType
    ) {

        if (!document.path) return null;

        return (

            <div className="rounded-2xl p-5 border border-[#27272A]">

                <h3 className="text-xl font-semibold mb-3">
                    {title}
                </h3>

                {document.status === "pending" && (
                    <div className="text-yellow-400 font-semibold">
                        ⏳ Pending Review
                    </div>
                )}

                {document.status === "approved" && (
                    <div className="text-green-500 font-semibold">
                        ✅ Approved
                    </div>
                )}

                {document.status === "rejected" && (
                    <>
                        <div className="text-red-500 font-semibold">
                            ❌ Rejected
                        </div>

                        <div className="text-gray-400 mt-2">
                            Reason: {document.rejectionReason}
                        </div>
                    </>
                )}

            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 text-white">

            <div className="max-w-3xl w-full rounded-3xl border border-[#27272A] bg-[#111111] p-10">

                <h1 className="text-5xl font-bold text-center">
                    Logi<span className="text-[#7F1D1D]">Track</span>
                </h1>

                <h2 className="text-3xl text-center mt-8 font-semibold">
                    Registration Status
                </h2>

                <div className="mt-10 space-y-6">

                    <div className="rounded-2xl border border-green-600 p-5">
                        ✅ Email Verified
                    </div>

                    {renderDocument(
                        "GST Certificate",
                        userData.documents.gstCertificate
                    )}

                    {renderDocument(
                        "Shop License",
                        userData.documents.shopLicense
                    )}

                    {renderDocument(
                        "Aadhaar Card",
                        userData.documents.aadhaar
                    )}

                    {renderDocument(
                        "Driving License",
                        userData.documents.drivingLicense
                    )}

                    <div
                        className={`rounded-2xl p-5 ${userData.status === "approved"
                                ? "border border-green-600"
                                : userData.status === "rejected"
                                    ? "border border-red-600"
                                    : "border border-yellow-600"
                            }`}
                    >

                        {userData.status === "pending" &&
                            "⏳ Waiting for Admin Approval"}

                        {userData.status === "approved" &&
                            "✅ Admin Approval Completed"}

                        {userData.status === "rejected" &&
                            "❌ Account Rejected"}

                    </div>

                    <div
                        className={`rounded-2xl p-5 ${userData.status === "approved"
                                ? "border border-green-600"
                                : userData.status === "rejected"
                                    ? "border border-red-600"
                                    : "border border-gray-700"
                            }`}
                    >

                        {userData.status === "pending" &&
                            "⌛ Account Activation"}

                        {userData.status === "approved" &&
                            "✅ Account Activated"}

                        {userData.status === "rejected" &&
                            "❌ Please check your email for more information"}

                    </div>

                    {userData.status === "approved" && (

                        <div className="text-center text-green-500 text-lg font-semibold">

                            Account approved successfully.
                            <br />
                            Redirecting to login page...

                        </div>

                    )}

                    {userData.status === "rejected" && (

                        <div className="text-center text-red-500 text-lg font-semibold">

                            Account rejected.
                            <br />
                            Redirecting to login page...

                        </div>

                    )}

                </div>

            </div>

        </main>
    );
}