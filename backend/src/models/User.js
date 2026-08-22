const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Business Owner", "Delivery Agent", "Customer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    applicationRejectionReason: {
      type: String,
      default: "",
    },

    businessName: {
      type: String,
    },

    gstNumber: {
      type: String,
    },

    businessAddress: {
      type: String,
    },

    documents: {
      aadhaar: {
        path: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        rejectionReason: {
          type: String,
          default: "",
        },
      },

      gstCertificate: {
        path: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        rejectionReason: {
          type: String,
          default: "",
        },
      },

      shopLicense: {
        path: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        rejectionReason: {
          type: String,
          default: "",
        },
      },

      drivingLicense: {
        path: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        rejectionReason: {
          type: String,
          default: "",
        },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", function () {
  if (this.role === "Customer") {
    this.status = "approved";
  }
});

module.exports = mongoose.model("User", userSchema);
