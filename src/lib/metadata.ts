import { Metadata } from "next";

export const siteMetadata: Metadata = {
  title: "Kaden Priebe | Cornell Student & Researcher",
  description: "Personal website of Kaden Priebe — researcher, builder, and Cornell student. Personality-first portfolio with minigames and random thoughts.",
  authors: [{ name: "Kaden Priebe" }],
  openGraph: {
    title: "Kaden Priebe | Personal Website",
    description: "Personal website of Kaden Priebe — researcher, builder, and Cornell student.",
    url: "https://kadenpriebe.com",
    siteName: "Kaden Priebe",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};
