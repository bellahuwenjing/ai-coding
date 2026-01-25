import { Poppins } from "next/font/google";
import "./globals.css";
import LenisScroll from "@/components/lenis-scroll";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "SchedulePro - Resource Scheduling Made Simple",
  description:
    "Schedule your people, vehicles, and equipment in one unified calendar. Eliminate double-bookings and manage all your resources with drag-and-drop simplicity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <LenisScroll />
      <body>{children}</body>
    </html>
  );
}
