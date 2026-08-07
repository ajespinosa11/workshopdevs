'use client'

import { useState, useEffect, useRef } from 'react'

interface GalleryImage {
  src: string
  title: string
  desc: string
}

const IMAGES: GalleryImage[] = [
  { src: '/first_workshop.jpg', title: 'Start your 3D Printing Journey', desc: 'Learn the fundamentals, explore different materials, and get hands-on with 3D Printing at Makerlab.' },
  { src: '/second_workshop.jpg', title: 'Inside the 3D Printing Workshop', desc: 'From learning the basics to creating their first prints, participants experienced the world of 3D Printing.' },
  { src: '/third_workshop.jpg', title: 'Make Ideas Comes to Life', desc: 'Bringing makers together to learn, experiment, and experienced 3D Printing firsthand.' },
  { src: '/fourth_workshop.jpg', title: 'Learn. Create. Make', desc: 'A closer look at our hands-on 3D Printing Workshop at Makerlab Experience Hub' },
  { src: '/fifth_workshop.jpg', title: 'Post-Processing Station', desc: 'Tools for sanding, painting, and cleaning completed prints.' },
  { src: '/sixth_workshop.jpg', title: 'Active Mentorship Session', desc: 'Instructors guiding students through calibration steps.' }
]

export default function Gallery() {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Autoplay video on mount (with mute)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }, [])

  // Handle lightbox keyboard navigation
  useEffect(() => {
    if (activePhotoIdx === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhotoIdx(null)
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIdx((prev) => (prev !== null ? (prev + 1) % IMAGES.length : null))
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIdx((prev) => (prev !== null ? (prev - 1 + IMAGES.length) % IMAGES.length : null))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePhotoIdx])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  return (
    <div className="gallery-section">
      <div className="gallery-header-container">
        <div className="gallery-header-left">
          <div className="trial-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7a2 2 0 0 0-2-2h-4.22l-1.09-1.63A2 2 0 0 0 14 2.5H10a2 2 0 0 0-1.72.87L7.22 5H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Explore Our Space
          </div>
          <h2 className="pricing-title">Workshop Gallery &amp; Video Tour</h2>
          <p className="pricing-subtitle">
            Take a visual tour of Makerlab. Browse our recently updated photos and watch our workspace in action.
          </p>
        </div>
      </div>

      {/* 2-column: portrait video left, all photos right */}
      <div className="gallery-content-grid">

        {/* Portrait video — sticky */}
        <div className="gallery-video-sticky">
          <div className="featured-video-container">
            <video
              ref={videoRef}
              src="/Workshop_Video.mp4"
              className="featured-video"
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
            />
            <div className="video-overlay-controls">
              <div className="video-info">
                <span className="video-live-badge">
                  <span className="live-dot"></span> TOUR VIDEO
                </span>
                <h3 className="video-title">Inside the Makerlab Workshop</h3>
              </div>
              <div className="video-action-buttons">
                <button onClick={togglePlay} className="video-control-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <button onClick={toggleMute} className="video-control-btn" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* All 6 photos — 3×2 grid filling same height as video */}
        <div className="photos-grid">
          {IMAGES.map((img, idx) => (
            <div key={idx} className="photo-card" onClick={() => setActivePhotoIdx(idx)}>
              <img src={img.src} alt={img.title} className="photo-thumbnail" />
              <div className="photo-card-overlay">
                <span className="photo-tag">View Image</span>
                <h4 className="photo-card-title">{img.title}</h4>
              </div>
            </div>
          ))}
        </div>

      </div>



      {/* Lightbox Modal */}
      {activePhotoIdx !== null && (
        <div className="lightbox-overlay" onClick={() => setActivePhotoIdx(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActivePhotoIdx(null)} aria-label="Close Lightbox">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <button
              className="lightbox-nav lightbox-prev"
              onClick={() => setActivePhotoIdx((prev) => (prev !== null ? (prev - 1 + IMAGES.length) % IMAGES.length : null))}
              aria-label="Previous Image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="lightbox-content">
              <img src={IMAGES[activePhotoIdx].src} alt={IMAGES[activePhotoIdx].title} className="lightbox-image" />
              <div className="lightbox-meta">
                <span className="lightbox-counter">{activePhotoIdx + 1} of {IMAGES.length}</span>
                <h3 className="lightbox-title">{IMAGES[activePhotoIdx].title}</h3>
                <p className="lightbox-desc">{IMAGES[activePhotoIdx].desc}</p>
              </div>
            </div>

            <button
              className="lightbox-nav lightbox-next"
              onClick={() => setActivePhotoIdx((prev) => (prev !== null ? (prev + 1) % IMAGES.length : null))}
              aria-label="Next Image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
