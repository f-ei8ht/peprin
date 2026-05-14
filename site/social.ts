// Social links rendered in header/footer.

export const SOCIAL_LINKS = {
  github: "https://github.com/peprin/peprin",
  x: "https://x.com/peprinapp",
  discord: "https://discord.gg/peprin",
} as const

export type SocialKey = keyof typeof SOCIAL_LINKS
