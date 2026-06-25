import React from 'react'

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function SortIcon({ className, ...props }: IconProps) {
  return (
    <svg
      width="17"
      height="21"
      viewBox="0 0 17 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M8.5 0L15.8612 9H1.13878L8.5 0Z" fill="currentColor" />
      <path d="M8.5 21L15.8612 12H1.13878L8.5 21Z" fill="currentColor" />
    </svg>
  )
}

export function SunIcon({ className, ...props }: IconProps) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12.5" cy="12.5" r="6.5" fill="currentColor" />
      <rect x="11" width="3" height="5" rx="1.5" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(1 0 0 -1 11 25)" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(0.707107 0.707107 0.707107 -0.707107 2 20.5356)" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(0.707107 0.707107 0.707107 -0.707107 17 5.53564)" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(0 1 1 0 20 11)" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(0 -1 -1 0 5 14)" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 20.5227 22.6687)" fill="currentColor" />
      <rect width="3" height="5" rx="1.5" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 5.53564 7.65674)" fill="currentColor" />
    </svg>
  )
}

export function MoonIcon({ className, ...props }: IconProps) {
  return (
    <svg
      width="19"
      height="20"
      viewBox="0 0 19 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M6.70312 0C4.49136 4.10427 4.96032 9.09175 8.19336 12.2139C11.0161 14.9397 15.1855 15.5076 18.877 14.042C17.2115 17.2489 13.8633 19.4414 10 19.4414C4.47715 19.4414 0 14.9643 0 9.44141C0 5.07401 2.8005 1.36265 6.70312 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function HelpIcon({ className, ...props }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM10.1025 12.5918C9.71054 12.5918 9.38774 12.7134 9.13574 12.9561C8.88391 13.1893 8.75783 13.4834 8.75781 13.8379C8.75781 14.1925 8.88383 14.4961 9.13574 14.748C9.39708 14.9907 9.71987 15.1123 10.1025 15.1123C10.4849 15.1122 10.8018 14.9905 11.0537 14.748C11.315 14.496 11.4463 14.1926 11.4463 13.8379C11.4463 13.4834 11.3202 13.1893 11.0684 12.9561C10.8165 12.7135 10.4943 12.5919 10.1025 12.5918ZM9.94824 5.03223C9.03359 5.03223 8.24035 5.19581 7.56836 5.52246C6.90569 5.84913 6.37833 6.31087 5.98633 6.9082L7.67969 7.90234C7.91302 7.57568 8.19818 7.32284 8.53418 7.14551C8.87941 6.95896 9.27146 6.86623 9.70996 6.86621C10.1671 6.86621 10.5311 6.96864 10.8018 7.17383C11.0818 7.36983 11.2217 7.64099 11.2217 7.98633C11.2216 8.22875 11.1472 8.44771 10.998 8.64355C10.8581 8.83019 10.6341 9.06382 10.3262 9.34375C9.90635 9.72625 9.58434 10.0763 9.36035 10.3936C9.14573 10.7108 9.03813 11.1125 9.03809 11.5977H11.1523C11.1524 11.2992 11.2311 11.047 11.3896 10.8418C11.5483 10.6271 11.8012 10.3656 12.1465 10.0576C12.4355 9.79654 12.6685 9.56793 12.8457 9.37207C13.0324 9.16676 13.1863 8.91918 13.3076 8.62988C13.4383 8.34057 13.5039 8.0047 13.5039 7.62207C13.5039 6.81012 13.1777 6.1751 12.5244 5.71777C11.8804 5.26046 11.0215 5.03225 9.94824 5.03223Z"
        fill="currentColor"
      />
    </svg>
  )
}
