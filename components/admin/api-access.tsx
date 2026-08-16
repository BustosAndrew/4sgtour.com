'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, Menu, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AccountSettingsDialog } from '@/components/admin/account-settings-dialog'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import type { ApiKeySummary } from '@/lib/types/database'

interface ApiAccessProps {
  userName: string
  userEmail: string
  userPhone: string | null
  userPhotoUrl: string | null
  apiKeys: ApiKeySummary[]
  /** Absolute base URL of this deployment, for the sample request. */
  siteUrl: string
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ApiAccess({
  userName,
  userEmail,
  userPhone,
  userPhotoUrl,
  apiKeys,
  siteUrl,
}: ApiAccessProps) {
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [keys, setKeys] = useState<ApiKeySummary[]>(apiKeys)
  const [name, setName] = useState('')
  const [allowCustomTrips, setAllowCustomTrips] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  /** The full secret, held in memory only until the admin dismisses it. */
  const [newKey, setNewKey] = useState<string | null>(null)

  const endpoint = `${siteUrl}/api/v1/trips/latest`

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || creating) return

    setCreating(true)
    setError(null)
    setCopied(false)

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), allowCustomTrips }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      setKeys((prev) => [data.apiKey, ...prev])
      setNewKey(data.key)
      setName('')
      setAllowCustomTrips(false)
    } catch (err) {
      console.error('[api-keys] Create failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (apiKey: ApiKeySummary) => {
    const confirmed = confirm(
      `Revoke "${apiKey.name}"? Any integration using this key stops working immediately. This cannot be undone.`,
    )
    if (!confirmed) return

    setRevokingId(apiKey.id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke API key')
      }

      setKeys((prev) => prev.map((k) => (k.id === apiKey.id ? data.apiKey : k)))
    } catch (err) {
      console.error('[api-keys] Revoke failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to revoke API key')
    } finally {
      setRevokingId(null)
    }
  }

  const handleToggleCustomTrips = async (
    apiKey: ApiKeySummary,
    allow: boolean,
  ) => {
    if (
      allow &&
      !confirm(
        `Let "${apiKey.name}" read custom trips? These are private, one-off itineraries built for individual customers. Only grant this to a partner who is meant to see them.`,
      )
    ) {
      return
    }

    setUpdatingId(apiKey.id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowCustomTrips: allow }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update API key')
      }

      setKeys((prev) => prev.map((k) => (k.id === apiKey.id ? data.apiKey : k)))
    } catch (err) {
      console.error('[api-keys] Update failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to update API key')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[api-keys] Copy failed:', err)
    }
  }

  const activeKeys = keys.filter((k) => !k.revoked_at)

  return (
    <div className="flex min-h-screen">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <AdminSidebar
        userName={userName}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 bg-[#f4f3ee]">
        <header className="border-b border-gray-300 bg-white px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mr-2 text-gray-900 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 sm:text-2xl">
                API Access
              </h1>
              <p className="text-xs text-gray-600 sm:text-sm">
                Issue and revoke keys for partners reading the trips feed
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-xs text-gray-500 sm:inline">
                Admin
              </span>
              <button
                onClick={() => setShowAccountSettings(true)}
                className="transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  {userPhotoUrl && (
                    <AvatarImage src={userPhotoUrl} alt={userName} />
                  )}
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* The one and only chance to copy the secret */}
          {newKey && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-amber-900">
                    Copy this key now
                  </h3>
                  <p className="mt-1 text-sm text-amber-800">
                    This is the only time it will be shown. Only a hash is
                    stored, so it cannot be recovered later — if it is lost,
                    revoke the key and create a new one.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-gray-900">
                      {newKey}
                    </code>
                    <Button
                      type="button"
                      onClick={() => handleCopy(newKey)}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewKey(null)}
                    className="mt-3 text-sm font-medium text-amber-900 underline"
                  >
                    I've saved it — hide this
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Create an API key
            </h2>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
              Give the key the name of the partner it is for, so it can be
              identified and revoked later.
            </p>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="api-key-name">Name</Label>
                  <Input
                    id="api-key-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tiger Booking"
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="flex-shrink-0"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {creating ? 'Creating…' : 'Create key'}
                </Button>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <Switch
                  id="allow-custom-trips"
                  checked={allowCustomTrips}
                  onCheckedChange={setAllowCustomTrips}
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="allow-custom-trips"
                    className="cursor-pointer text-sm font-medium text-gray-900"
                  >
                    Allow custom trips
                  </Label>
                  <p className="text-xs text-gray-600">
                    Lets this partner request custom trips — private, one-off
                    itineraries built for individual customers. Off by default,
                    and changeable later without reissuing the key.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Keys */}
          <div className="mb-6 rounded-lg bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">Keys</h2>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                {activeKeys.length} active
                {keys.length !== activeKeys.length &&
                  ` · ${keys.length - activeKeys.length} revoked`}
              </p>
            </div>

            {keys.length === 0 ? (
              <p className="p-4 text-sm text-gray-600 sm:p-6">
                No API keys yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {keys.map((apiKey) => (
                  <li
                    key={apiKey.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {apiKey.name}
                        </span>
                        {apiKey.revoked_at ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Revoked
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Active
                          </span>
                        )}
                        {apiKey.allow_custom_trips && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Custom trips
                          </span>
                        )}
                      </div>
                      <code className="mt-1 block font-mono text-xs text-gray-500">
                        {apiKey.key_prefix}…
                      </code>
                      <p className="mt-1 text-xs text-gray-500">
                        Created {formatDate(apiKey.created_at)} · Last used{' '}
                        {formatDate(apiKey.last_used_at)}
                        {apiKey.revoked_at &&
                          ` · Revoked ${formatDate(apiKey.revoked_at)}`}
                      </p>
                    </div>

                    {!apiKey.revoked_at && (
                      <div className="flex flex-shrink-0 items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`custom-trips-${apiKey.id}`}
                            checked={apiKey.allow_custom_trips}
                            disabled={updatingId === apiKey.id}
                            onCheckedChange={(checked) =>
                              handleToggleCustomTrips(apiKey, checked)
                            }
                          />
                          <Label
                            htmlFor={`custom-trips-${apiKey.id}`}
                            className="cursor-pointer whitespace-nowrap text-xs text-gray-600"
                          >
                            Custom trips
                          </Label>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRevoke(apiKey)}
                          disabled={revokingId === apiKey.id}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {revokingId === apiKey.id ? 'Revoking…' : 'Revoke'}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* What the key unlocks */}
          <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Endpoint</h2>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
              A key grants read-only access to the latest published trips.
              Custom trips are excluded unless the key is allowed them and the
              request asks for them with <code>include_custom=true</code>.
            </p>
            <div className="mt-4 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3">
              <pre className="whitespace-pre font-mono text-xs text-gray-800">
                {`curl "${endpoint}?limit=10&locale=en" \\
  -H "Authorization: Bearer <api-key>"`}
              </pre>
            </div>
          </div>
        </div>
      </main>

      <AccountSettingsDialog
        open={showAccountSettings}
        onOpenChange={setShowAccountSettings}
        userName={userName}
        userEmail={userEmail}
        userPhone={userPhone}
        userPhotoUrl={userPhotoUrl}
      />
    </div>
  )
}
