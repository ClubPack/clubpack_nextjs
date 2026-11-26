import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getAllPosts } from "@/lib/blog"
import { Reveal } from "../components/motion"
import { CONTAINER, PageHero } from "../components/primitives"


export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, insights, and guides for college club leaders — from ClubPack.",
}

/** Pretty-print a date string like "July 22, 2025". */
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Notes for club leaders"
        description="Tips, insights, and guides for college club leaders."
      />

      <section className="pb-20 sm:pb-32 bg-white">
        <div className={CONTAINER}>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 0.08}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-gray-900/5">
                  <Image
                    src={post.frontmatter.coverImage}
                    alt={post.frontmatter.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="flex flex-col flex-1 pt-5">
                  <p className="text-sm text-gray-500 mb-2">
                    {formatDate(post.frontmatter.date)}
                    <span aria-hidden className="mx-2">·</span>
                    <span className="font-semibold text-[#0054f9]">
                      {post.frontmatter.category}
                    </span>
                  </p>

                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mb-2 group-hover:text-[#0054f9] transition-colors line-clamp-2">
                    {post.frontmatter.title}
                  </h2>

                  <p className="text-gray-600 leading-relaxed line-clamp-3 flex-1">
                    {post.frontmatter.description}
                  </p>

                  <p className="text-sm text-gray-500 mt-4">
                    {post.frontmatter.readingTime} min read
                  </p>
                </div>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
