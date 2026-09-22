import type { MetadataRoute } from "next";

/**
 * Web app manifest — what Android/Chrome read when the app is installed or
 * added to the home screen. iOS reads `apple-icon.png` and the `appleWebApp`
 * metadata in the root layout instead.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sakafa Academy — Admin",
    // Shown under the home screen icon, so keep it short enough not to be
    // truncated (~12 characters).
    short_name: "Sakafa",
    description: "Students, groups, attendance and monthly payments",
    start_url: "/dashboard",
    // Opens without browser chrome, like a native app.
    display: "standalone",
    background_color: "#ffffff",
    // Tints the Android status bar — the crest's navy.
    theme_color: "#142473",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android launchers crop icons to their own shape; this one has the
      // safe-zone padding they expect.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
