"use client"

import * as React from "react"
import { UsersThree, Sparkle, FunnelSimple, Plus, Image } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { AvatarLook } from "@/lib/heygen/types"

import { AvatarCard } from "./avatar-card"
import { AvatarGeneratorDialog } from "./avatar-generator-dialog"
import { CreateAvatarDialog } from "./create-avatar-dialog"
import { ImageToVideoDialog } from "./image-to-video-dialog"

type AvatarFilter = "all" | "studio_avatar" | "digital_twin" | "photo_avatar"
type OwnershipFilter = "all" | "public" | "private"

export function AvatarsTab() {
  const [looks, setLooks] = React.useState<AvatarLook[]>([])
  const [loading, setLoading] = React.useState(true)
  const [nextToken, setNextToken] = React.useState<string | null>(null)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<AvatarFilter>("all")
  const [ownershipFilter, setOwnershipFilter] = React.useState<OwnershipFilter>("all")
  const [selectedLook, setSelectedLook] = React.useState<AvatarLook | null>(null)
  const [generatorOpen, setGeneratorOpen] = React.useState(false)
  const [createAvatarOpen, setCreateAvatarOpen] = React.useState(false)
  const [imageToVideoOpen, setImageToVideoOpen] = React.useState(false)
  const prevTypeRef = React.useRef(typeFilter)
  const prevOwnershipRef = React.useRef(ownershipFilter)

  // Fetch when filters change (avoiding setState-in-effect pattern)
  React.useEffect(() => {
    if (prevTypeRef.current !== typeFilter || prevOwnershipRef.current !== ownershipFilter) {
      prevTypeRef.current = typeFilter
      prevOwnershipRef.current = ownershipFilter
      setLooks([])
      setNextToken(null)
      setLoading(true)

      const params = new URLSearchParams()
      if (typeFilter !== "all") params.set("avatar_type", typeFilter)
      if (ownershipFilter !== "all") params.set("ownership", ownershipFilter)
      params.set("limit", "20")

      fetch(`/api/heygen/avatars/looks?${params}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setLooks(json.data)
            setNextToken(json.next_token)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [typeFilter, ownershipFilter])

  const loadMore = React.useCallback(() => {
    if (!nextToken || loadingMore) return
    setLoadingMore(true)

    const params = new URLSearchParams()
    if (typeFilter !== "all") params.set("avatar_type", typeFilter)
    if (ownershipFilter !== "all") params.set("ownership", ownershipFilter)
    params.set("limit", "20")
    params.set("token", nextToken)

    fetch(`/api/heygen/avatars/looks?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setLooks((prev) => [...prev, ...json.data])
          setNextToken(json.next_token)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [nextToken, loadingMore, typeFilter, ownershipFilter])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return looks
    return looks.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [looks, search])

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex shrink-0 flex-col gap-2 border-b p-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-8 flex-1"
            onClick={() => setCreateAvatarOpen(true)}
          >
            <Plus size={14} weight="bold" />
            Create Avatar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1"
            onClick={() => setImageToVideoOpen(true)}
          >
            <Image size={14} weight="bold" />
            Image to Video
          </Button>
        </div>

        <Button
          size="sm"
          className="h-8 w-full"
          onClick={() => {
            if (looks.length > 0) {
              setSelectedLook(looks[0])
              setGeneratorOpen(true)
            }
          }}
        >
          <Sparkle size={14} weight="bold" />
          Generate avatar video
        </Button>

        <Input
          placeholder="Search avatars"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
        />

        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as AvatarFilter)}
          >
            <SelectTrigger className="h-7 text-xs">
              <FunnelSimple size={12} weight="bold" className="mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="studio_avatar">Studio</SelectItem>
              <SelectItem value="digital_twin">Digital Twin</SelectItem>
              <SelectItem value="photo_avatar">Photo</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={ownershipFilter}
            onValueChange={(v) => setOwnershipFilter(v as OwnershipFilter)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">My avatars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="size-4" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyAvatarsState />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((look) => (
                <AvatarCard
                  key={look.id}
                  look={look}
                  onSelect={() => {
                    setSelectedLook(look)
                    setGeneratorOpen(true)
                  }}
                />
              ))}
            </div>

            {nextToken && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 h-7 w-full text-xs"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Spinner className="mr-1 size-3" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Generator dialog */}
      {selectedLook && (
        <AvatarGeneratorDialog
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          look={selectedLook}
        />
      )}

      {/* Create Avatar dialog */}
      <CreateAvatarDialog
        open={createAvatarOpen}
        onOpenChange={setCreateAvatarOpen}
        onAvatarCreated={() => {
          // Refresh the avatar list
          setLooks([])
          setNextToken(null)
          setLoading(true)

          const params = new URLSearchParams()
          if (typeFilter !== "all") params.set("avatar_type", typeFilter)
          if (ownershipFilter !== "all") params.set("ownership", ownershipFilter)
          params.set("limit", "20")

          fetch(`/api/heygen/avatars/looks?${params}`)
            .then((r) => r.json())
            .then((json) => {
              if (json.data) {
                setLooks(json.data)
                setNextToken(json.next_token)
              }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
        }}
      />

      {/* Image to Video dialog */}
      <ImageToVideoDialog
        open={imageToVideoOpen}
        onOpenChange={setImageToVideoOpen}
      />
    </div>
  )
}

function EmptyAvatarsState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="bg-foreground/5 inline-flex size-12 items-center justify-center rounded-full">
        <UsersThree size={20} weight="duotone" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">No avatars found</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Try adjusting your filters or browse public avatars.
        </p>
      </div>
    </div>
  )
}
