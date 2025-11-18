"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Upload } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  userName: string
  userPhone: string | null
  userPhotoUrl: string | null
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  userEmail,
  userName,
  userPhone,
  userPhotoUrl
}: AccountSettingsDialogProps) {
  const [displayName, setDisplayName] = useState(userName || "")
  const [phone, setPhone] = useState(userPhone || "")
  const [photoUrl, setPhotoUrl] = useState(userPhotoUrl || "")
  const [uploadMode, setUploadMode] = useState<"url" | "upload">("url")
  const [isUploading, setIsUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      setPhotoUrl(url)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Update profile info (name, phone, photo)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (phone && phone !== userPhone) {
        const { error: authPhoneError } = await supabase.auth.updateUser({
          phone: phone,
        })
        if (authPhoneError) throw authPhoneError
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          phone: phone || null,
          photo_url: photoUrl || null,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({
            title: "Error",
            description: "New passwords do not match",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        if (newPassword.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (passwordError) throw passwordError
      }

      toast({
        title: "Success",
        description: "Account settings updated successfully",
      })

      setNewPassword("")
      setConfirmPassword("")
      
      router.refresh()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Picture */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 mx-auto sm:mx-0">
                {photoUrl ? (
                  <Image src={photoUrl || "/placeholder.svg"} alt="Profile" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-500">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={uploadMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMode("url")}
                    className="w-full"
                  >
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMode("upload")}
                    className="w-full"
                  >
                    Upload
                  </Button>
                </div>

                {uploadMode === "url" ? (
                  <div>
                    <Input
                      placeholder="Enter image URL"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="cursor-pointer text-sm"
                    />
                    {isUploading && (
                      <p className="mt-1 text-xs text-gray-500">Uploading...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userEmail} disabled className="bg-gray-100" />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Change Password Section */}
          <div className="border-t pt-4">
            <h3 className="mb-3 font-medium">Change Password</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isLoading || isUploading}
              className="w-full bg-[#6b705c] hover:bg-[#5a5f4d] sm:flex-1"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
