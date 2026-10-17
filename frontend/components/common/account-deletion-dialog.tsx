"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/common/PasswordInput";
import { deleteCurrentAccount } from "@/lib/api";
import { useLogout } from "@/lib/logout";

const CONFIRM_TEXT = "DELETE MY ACCOUNT";

type AccountDeletionDialogProps = {
  roleLabel: string;
  buttonClassName?: string;
  menuItemClassName?: string;
  triggerMode?: "button" | "menuItem";
};

export function AccountDeletionDialog({
  roleLabel,
  buttonClassName,
  menuItemClassName,
  triggerMode = "button",
}: AccountDeletionDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useLogout();

  const resetState = () => {
    setCurrentPassword("");
    setConfirmText("");
    setError(null);
    setIsDeleting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_TEXT) {
      setError(`Type ${CONFIRM_TEXT} to continue.`);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteCurrentAccount({
        currentPassword,
        confirmText,
      });

      toast.success("Your account has been deleted.");
      handleOpenChange(false);
      logout();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete account.";
      setError(message);
      toast.error(message);
      setIsDeleting(false);
    }
  };

  const trigger =
    triggerMode === "menuItem" ? (
      <DropdownMenuItem
        onSelect={() => handleOpenChange(true)}
        className={menuItemClassName || "text-red-400 focus:text-red-300"}
      >
        Delete Account
      </DropdownMenuItem>
    ) : (
      <Button
        variant="outline"
        className={
          buttonClassName ||
          "w-full justify-start border-red-900/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:text-white"
        }
        onClick={() => handleOpenChange(true)}
      >
        <Trash2 size={16} />
        Delete Account
      </Button>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="border-[#2A2B30] bg-[#1A1B1E] text-white sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={18} />
              </div>
              <div>
                <DialogTitle className="text-xl text-white">
                  Delete account permanently
                </DialogTitle>
                <DialogDescription className="mt-1 text-[#A1A1AA]">
                  This will permanently delete your {roleLabel.toLowerCase()} account and sign you out.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              Account deletion cannot be undone. Active records will be updated to keep the system consistent.
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-[#A1A1AA]">Current password</Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter your current password"
                className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:border-red-500"
                disabled={isDeleting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="text-[#A1A1AA]">Type confirmation phrase</Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder={CONFIRM_TEXT}
                className="border-[#2A2B30] bg-[#111214] text-white focus:border-red-500"
                disabled={isDeleting}
              />
            </div>

            <Separator className="bg-[#2A2B30]" />

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                isDeleting ||
                !currentPassword.trim() ||
                confirmText !== CONFIRM_TEXT
              }
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}