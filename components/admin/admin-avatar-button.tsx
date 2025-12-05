"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AccountSettingsDialog } from "@/components/admin/account-settings-dialog"

interface AdminAvatarButtonProps {
  userName: string
  userEmail: string
  userPhone: string | null
  userPhotoUrl: string | null
}

export function AdminAvatarButton({
  userName,
  userEmail,
  userPhone,
  userPhotoUrl,
}: AdminAvatarButtonProps) {
  const [showAccountSettings, setShowAccountSettings] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowAccountSettings(true)}
        className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={userPhotoUrl || undefined}
            alt={userName || "Admin"}
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {(userName || userEmail || "A")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground hidden sm:block">Admin</p>
      </button>

      <AccountSettingsDialog
        open={showAccountSettings}
        onOpenChange={setShowAccountSettings}
        userEmail={userEmail}
        userName={userName}
        userPhone={userPhone}
        userPhotoUrl={userPhotoUrl}
      />
    </>
  )
}
