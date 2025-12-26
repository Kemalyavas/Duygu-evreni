'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

// Redirect content component
function RedirectContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const planetId = params.id as string
  const starId = searchParams.get('star')

  useEffect(() => {
    // Build new URL
    let newUrl = `/?planet=${planetId}`
    if (starId) {
      newUrl += `&star=${starId}`
    }
    // Redirect to new URL
    router.replace(newUrl)
  }, [planetId, starId, router])

  // Show nothing during redirect
  return (
    <div className="min-h-screen bg-black" />
  )
}

// Redirect old /gezegen/[id] URLs to new /?planet=[id] format
export default function PlanetPageRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <RedirectContent />
    </Suspense>
  )
}
