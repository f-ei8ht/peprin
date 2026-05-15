// HeyGen API client — used by server-side API routes.
// Never import this in client components — the API key must stay server-only.

import {
  type AvatarGroup,
  type AvatarLook,
  type Voice,
  type VoiceDesignResponse,
  type CreateVideoRequest,
  type CreateVideoResponse,
  type VideoStatus,
  type CreateLipsyncRequest,
  type CreateLipsyncResponse,
  type LipsyncStatus,
  type CreateTranslationRequest,
  type CreateTranslationResponse,
  type TranslationStatus,
  type CreateSpeechRequest,
  type SpeechResponse,
  type HeyGenUser,
  type HeyGenPaginatedResponse,
  type HeyGenApiResponse,
  type CreateAvatarRequest,
  type CreateAvatarResponse,
  type AssetUploadResponse,
} from "./types"

const BASE = "https://api.heygen.com"

function apiKey(): string {
  const key = process.env.HEYGEN_API_KEY
  if (!key) throw new Error("HEYGEN_API_KEY is not set")
  return key
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": apiKey(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(
      `HeyGen API error ${res.status}: ${body?.error?.message ?? res.statusText}`
    )
  }

  const json = await res.json()
  return json as T
}

// --- Avatars ---

export async function listAvatarGroups(params?: {
  ownership?: "public" | "private"
  limit?: number
  token?: string
}): Promise<HeyGenPaginatedResponse<AvatarGroup>> {
  const qs = new URLSearchParams()
  if (params?.ownership) qs.set("ownership", params.ownership)
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.token) qs.set("token", params.token)
  const query = qs.toString()
  return request(`/v3/avatars${query ? `?${query}` : ""}`)
}

export async function listAvatarLooks(params?: {
  group_id?: string
  avatar_type?: string
  ownership?: "public" | "private"
  limit?: number
  token?: string
}): Promise<HeyGenPaginatedResponse<AvatarLook>> {
  const qs = new URLSearchParams()
  if (params?.group_id) qs.set("group_id", params.group_id)
  if (params?.avatar_type) qs.set("avatar_type", params.avatar_type)
  if (params?.ownership) qs.set("ownership", params.ownership)
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.token) qs.set("token", params.token)
  const query = qs.toString()
  return request(`/v3/avatars/looks${query ? `?${query}` : ""}`)
}

export async function getAvatarLook(lookId: string): Promise<HeyGenApiResponse<AvatarLook>> {
  return request(`/v3/avatars/looks/${lookId}`)
}

// --- Voices ---

export async function listVoices(params?: {
  type?: "public" | "private"
  engine?: string
  language?: string
  gender?: string
  limit?: number
  token?: string
}): Promise<HeyGenPaginatedResponse<Voice>> {
  const qs = new URLSearchParams()
  if (params?.type) qs.set("type", params.type)
  if (params?.engine) qs.set("engine", params.engine)
  if (params?.language) qs.set("language", params.language)
  if (params?.gender) qs.set("gender", params.gender)
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.token) qs.set("token", params.token)
  const query = qs.toString()
  return request(`/v3/voices${query ? `?${query}` : ""}`)
}

export async function designVoice(params: {
  prompt: string
  gender?: string
  locale?: string
  seed?: number
}): Promise<HeyGenApiResponse<VoiceDesignResponse>> {
  return request("/v3/voices", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export async function createSpeech(params: CreateSpeechRequest): Promise<HeyGenApiResponse<SpeechResponse>> {
  return request("/v3/voices/speech", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// --- Videos ---

export async function createVideo(body: CreateVideoRequest): Promise<HeyGenApiResponse<CreateVideoResponse>> {
  return request("/v3/videos", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getVideo(videoId: string): Promise<HeyGenApiResponse<VideoStatus>> {
  return request(`/v3/videos/${videoId}`)
}

// --- Lipsync ---

export async function createLipsync(body: CreateLipsyncRequest): Promise<HeyGenApiResponse<CreateLipsyncResponse>> {
  return request("/v3/lipsyncs", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getLipsync(lipsyncId: string): Promise<HeyGenApiResponse<LipsyncStatus>> {
  return request(`/v3/lipsyncs/${lipsyncId}`)
}

// --- Translation ---

export async function createTranslation(body: CreateTranslationRequest): Promise<HeyGenApiResponse<CreateTranslationResponse>> {
  return request("/v3/video-translations", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getTranslation(translationId: string): Promise<HeyGenApiResponse<TranslationStatus>> {
  return request(`/v3/video-translations/${translationId}`)
}

export async function listTranslationLanguages(): Promise<HeyGenApiResponse<string[]>> {
  return request("/v3/video-translations/languages")
}

// --- User ---

export async function getCurrentUser(): Promise<HeyGenApiResponse<HeyGenUser>> {
  return request("/v3/users/me")
}

// --- Avatar Creation ---

export async function createAvatar(body: CreateAvatarRequest): Promise<HeyGenApiResponse<CreateAvatarResponse>> {
  return request("/v3/avatars", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

// --- Asset Upload ---

export async function uploadAsset(file: File): Promise<HeyGenApiResponse<AssetUploadResponse>> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BASE}/v3/assets`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey(),
    },
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(
      `HeyGen API error ${res.status}: ${body?.error?.message ?? res.statusText}`
    )
  }

  const json = await res.json()
  return json as HeyGenApiResponse<AssetUploadResponse>
}
