"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Users } from "lucide-react";
import { ClubNavbar } from "@/app/(club-site)/components/club-navbar";
import { tourUpcomingEvents, tourClubNav } from "../../mock-data";

function formatDateLong(eventDateIso: string | null): string {
  if (!eventDateIso) return "";
  const d = new Date(`${eventDateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ClubEventsView() {
  return (
    <div className="min-h-dvh w-full overflow-auto bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-dvh flex flex-col bg-white"
      >
        <ClubNavbar
          site={tourClubNav.site}
          clubName={tourClubNav.clubName}
          clubLogo={tourClubNav.clubLogo}
          user={null}
          memberAvatarUrl={null}
          variant="dark"
        />
        <main className="flex-grow bg-white pt-28 pb-20">
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Upcoming Events
              </h1>
              <p className="text-lg text-gray-700 sm:text-xl">
                Join us at our upcoming events and activities
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tourUpcomingEvents.map((event) => {
                const dateLong = formatDateLong(event.eventDateIso ?? null);
                const timeRange = event.endTime
                  ? `${event.time} – ${event.endTime}`
                  : event.time;
                const imageUrl = event.imageUrl || "/club-photos/happy-group.webp";
                return (
                  <div
                    key={event.id}
                    className="flex flex-col overflow-hidden border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300"
                  >
                    <Link
                      href={`/events/${event.id}`}
                      className="relative block aspect-video w-full shrink-0"
                    >
                      <Image
                        src={imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </Link>
                    <div className="flex flex-grow flex-col p-6 lg:p-8">
                      <div className="mb-4 flex-grow">
                        {timeRange && timeRange !== "TBD" && (
                          <div className="mb-1 text-xs font-medium text-gray-500">
                            {timeRange}
                          </div>
                        )}
                        {dateLong && (
                          <div className="text-sm font-medium text-gray-900">
                            {dateLong}
                          </div>
                        )}
                        <h2 className="mb-4 mt-4 line-clamp-2 text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
                          <Link
                            href={`/events/${event.id}`}
                            className="hover:underline"
                          >
                            {event.title}
                          </Link>
                        </h2>
                        {(event.location || event.max_attendees != null) && (
                          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                            {event.location && event.location !== "TBD" && (
                              <div className="flex items-center text-gray-600">
                                <MapPin className="mr-1.5 size-4 shrink-0 text-gray-400" />
                                <span className="text-sm">{event.location}</span>
                              </div>
                            )}
                            {typeof event.max_attendees === "number" && (
                              <div className="flex items-center text-gray-600">
                                <Users className="mr-1.5 size-4 shrink-0 text-gray-400" />
                                <span className="text-sm">
                                  {event.rsvpCount ?? 0}/{event.max_attendees}{" "}
                                  attending
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {event.description && (
                          <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Button
                        asChild
                        className="h-auto w-full rounded-none bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-300 hover:opacity-90 hover:shadow-md"
                      >
                        <Link href={`/events/${event.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
