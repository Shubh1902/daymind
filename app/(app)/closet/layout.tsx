import ClosetThemeProvider from "@/components/closet/ClosetThemeProvider"

export default function ClosetLayout({ children }: { children: React.ReactNode }) {
  return <ClosetThemeProvider>{children}</ClosetThemeProvider>
}
