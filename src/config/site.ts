export const siteConfig = {
    name: "Foundry",
    description: "A production-ready SaaS boilerplate using Next.js 14.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    links: {
        x: "https://x.com/Oseni03",
        linkedin: "https://linkedin.com/in/Oseni03",
        github: "https://github.com/Oseni03",
    },
    logoUrl: "/logo.png"
};

export type SiteConfig = typeof siteConfig;
