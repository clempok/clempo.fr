/**
 * Centralized booking CTA helper.
 *
 * All "Organiser un brief / Prendre rendez-vous" CTAs on the site point to the
 * in-house booking page at /booking (not Lemcal). The `?src=` query param is read
 * by VisitTracker in App.tsx and logged server-side via /.netlify/functions/track-visit,
 * so we can attribute booked calls to the page/CTA that drove them.
 *
 * Usage:
 *   <Link to={bookingUrl('home-hero')}>...</Link>
 *   <Link to={bookingUrl(`article-${slug}`)}>...</Link>
 *
 * Conventions for `src` values (keep them stable — analytics depend on them):
 *   home-hero, home-about, home-advisor, home-parttime, home-footer
 *   footer, navbar
 *   transition-cmo
 *   consultant-marketing-sante
 *   articles-list, article-<slug>
 *   brochure-download
 *
 * Never hardcode "/booking?src=..." anywhere else. If you need a new src value,
 * add it here in the conventions list so we can track the taxonomy.
 */
export function bookingUrl(src: string): string {
  const safe = encodeURIComponent(src)
  return `/booking?src=${safe}`
}
