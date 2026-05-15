// HeyGen API types — v3 endpoints only.
// https://developers.heygen.com

// --- Common ---

export interface HeyGenApiResponse<T> {
  data: T
}

export interface HeyGenPaginatedResponse<T> {
  data: T[]
  has_more: boolean
  next_token: string | null
}

export interface HeyGenError {
  code: string
  message: string
  param: string | null
  doc_url: string | null
}

export type HeyGenStatus = "pending" | "processing" | "running" | "completed" | "failed" | "waiting"

export type AvatarType = "studio_avatar" | "digital_twin" | "photo_avatar"
export type VideoResolution = "4k" | "1080p" | "720p"
export type VideoAspectRatio = "16:9" | "9:16"
export type VideoOutputFormat = "mp4" | "webm"
export type AvatarFit = "contain" | "cover"
export type Expressiveness = "high" | "medium" | "low"
export type LipsyncMode = "speed" | "precision"
export type TranslationMode = "speed" | "precision"

// --- Avatars ---

export interface AvatarGroup {
  id: string
  name: string
  gender: string | null
  preview_image_url: string | null
  preview_video_url: string | null
  looks_count: number
  default_voice_id: string | null
  consent_status: string | null
  status: string | null
  created_at: number
}

export interface AvatarLook {
  id: string
  name: string
  avatar_type: AvatarType
  group_id: string | null
  gender: string | null
  preview_image_url: string | null
  preview_video_url: string | null
  default_voice_id: string | null
  tags: string[]
  supported_api_engines: string[]
  status: string | null
  image_width: number | null
  image_height: number | null
  preferred_orientation: "portrait" | "landscape" | "square" | null
}

// --- Voices ---

export interface Voice {
  voice_id: string
  name: string
  language: string
  gender: string
  type: "public" | "private"
  preview_audio_url: string | null
  support_pause: boolean
  support_locale: boolean
}

export interface VoiceDesignResponse {
  voices: Voice[]
  seed: number
}

export interface VoiceSettings {
  speed?: number
  pitch?: number
  locale?: string
}

// --- Video Creation ---

export interface BackgroundSetting {
  type: "color" | "image"
  value?: string
  url?: string
  asset_id?: string
}

export interface CaptionSetting {
  file_format?: "srt"
  style?: "default" | null
}

export interface CreateVideoFromAvatar {
  type: "avatar"
  avatar_id: string
  script?: string
  voice_id?: string
  audio_url?: string
  audio_asset_id?: string
  title?: string
  resolution?: VideoResolution
  aspect_ratio?: VideoAspectRatio
  fit?: AvatarFit
  background?: BackgroundSetting
  remove_background?: boolean
  engine?: { type: "avatar_iv" } | { type: "avatar_v" }
  motion_prompt?: string
  expressiveness?: Expressiveness
  voice_settings?: VoiceSettings
  caption?: CaptionSetting
  output_format?: VideoOutputFormat
  callback_url?: string
  callback_id?: string
}

export interface AssetInput {
  type: "url" | "asset_id" | "base64"
  url?: string
  asset_id?: string
  media_type?: string
  data?: string
}

export interface CreateVideoFromImage {
  type: "image"
  image: AssetInput
  script?: string
  voice_id?: string
  audio_url?: string
  audio_asset_id?: string
  title?: string
  resolution?: VideoResolution
  aspect_ratio?: VideoAspectRatio
  fit?: AvatarFit
  background?: BackgroundSetting
  remove_background?: boolean
  motion_prompt?: string
  expressiveness?: Expressiveness
  voice_settings?: VoiceSettings
  caption?: CaptionSetting
  output_format?: VideoOutputFormat
  callback_url?: string
  callback_id?: string
}

export type CreateVideoRequest = CreateVideoFromAvatar | CreateVideoFromImage

export interface CreateVideoResponse {
  video_id: string
  status: string
  output_format: VideoOutputFormat
}

export interface VideoStatus {
  id: string
  status: HeyGenStatus
  video_url: string | null
  thumbnail_url: string | null
  duration: number | null
  failure_code: string | null
  failure_message: string | null
}

// --- Lipsync ---

export interface CreateLipsyncRequest {
  video: AssetInput
  audio: AssetInput
  title?: string
  mode?: LipsyncMode
  enable_caption?: boolean
  enable_dynamic_duration?: boolean
  disable_music_track?: boolean
  enable_speech_enhancement?: boolean
  enable_watermark?: boolean
  start_time?: number
  end_time?: number
  keep_the_same_format?: boolean
  fps_mode?: "vfr" | "cfr" | "passthrough"
  callback_url?: string
  callback_id?: string
  folder_id?: string
}

export interface CreateLipsyncResponse {
  lipsync_id: string
}

export interface LipsyncStatus {
  id: string
  title: string | null
  status: HeyGenStatus
  duration: number | null
  video_url: string | null
  callback_id: string | null
  created_at: number | null
  failure_message: string | null
}

// --- Translation ---

export interface CreateTranslationRequest {
  video: AssetInput
  output_languages: string[]
  title?: string
  mode?: TranslationMode
  audio?: AssetInput
  input_language?: string
  translate_audio_only?: boolean
  speaker_num?: number
  enable_caption?: boolean
  enable_dynamic_duration?: boolean
  disable_music_track?: boolean
  enable_speech_enhancement?: boolean
  enable_watermark?: boolean
  keep_the_same_format?: boolean
  callback_url?: string
  callback_id?: string
  folder_id?: string
}

export interface CreateTranslationResponse {
  video_translation_ids: string[]
}

export interface TranslationStatus {
  id: string
  title: string | null
  status: HeyGenStatus
  duration: number | null
  video_url: string | null
  output_language: string | null
  callback_id: string | null
  created_at: number | null
  failure_message: string | null
}

// --- Text to Speech ---

export interface CreateSpeechRequest {
  text: string
  voice_id: string
  input_type?: "text" | "ssml"
  speed?: number
  language?: string
  locale?: string
}

export interface WordTimestamp {
  word: string
  start: number
  end: number
}

export interface SpeechResponse {
  audio_url: string
  duration: number
  request_id: string | null
  word_timestamps: WordTimestamp[] | null
}

// --- User ---

export interface HeyGenUser {
  username: string
  email: string | null
  first_name: string | null
  last_name: string | null
  billing_type: "wallet" | "subscription" | "usage_based" | null
  wallet: {
    currency: string
    remaining_balance: number | null
    auto_reload: {
      enabled: boolean
      threshold_usd: number | null
      amount_usd: number | null
    }
  } | null
  subscription: {
    plan: string
    credits: {
      premium_credits: { remaining: number | null; resets_at: string | null }
      add_on_credits: { remaining: number | null; resets_at: string | null }
    }
  } | null
  usage_based: {
    spending_current_usd: number | null
    spending_cap_usd: number | null
  } | null
}
