
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    ExternalLink,
} from "lucide-react"

const STREAM_URL = "https://ice1.somafm.com/groovesalad-128-mp3"
const METADATA_URL = "https://somafm.com/songs/groovesalad.json"

type Track = {
    title: string
    artist: string
}

const BAR_COUNT = 20

function getTrack(data: unknown): Track | null {
    if (!data || typeof data !== "object") return null

    const payload = data as Record<string, unknown>
    const songs = Array.isArray(payload.songs) ? payload.songs : []
    const current = (songs[0] ?? payload) as Record<string, unknown>

    const title = current.title ?? current.Song ?? current.song
    const artist = current.artist ?? current.Artist

    if (typeof title !== "string") return null

    return {
        title,
        artist: typeof artist === "string" ? artist : "SomaFM",
    }
}

export function RadioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    const mobileBarRefs = useRef<(HTMLDivElement | null)[]>([])
    const desktopBarRefs = useRef<(HTMLDivElement | null)[]>([])

    const frameRef = useRef(0)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [volume, setVolume] = useState(25)
    const [error, setError] = useState<string | null>(null)

    const [track, setTrack] = useState<Track>({
        title: "Groove Salad",
        artist: "SomaFM",
    })

    // Metadata
    const fetchMetadata = useCallback(async () => {
        try {
            const response = await fetch(METADATA_URL, {
                cache: "no-store",
            })

            if (!response.ok) return

            const data: unknown = await response.json()
            const currentTrack = getTrack(data)

            if (currentTrack) setTrack(currentTrack)
        } catch {
            // Metadata is optional.
        }
    }, [])

    useEffect(() => {
        void fetchMetadata()

        const interval = window.setInterval(fetchMetadata, 30_000)

        return () => window.clearInterval(interval)
    }, [fetchMetadata])

    // Volume
    const handleVolumeChange = (value: number) => {
        const nextVolume = Math.max(0, Math.min(100, value))

        setVolume(nextVolume)

        if (audioRef.current) {
            audioRef.current.volume = nextVolume / 100
        }
    }

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100
        }
    }, [volume])

    // Audio analyser
    const initializeAudioAnalyser = async () => {
        const audio = audioRef.current
        if (!audio) return

        try {
            if (!audioContextRef.current) {
                const context = new AudioContext()
                const analyser = context.createAnalyser()

                analyser.fftSize = 512
                analyser.smoothingTimeConstant = 0.78
                analyser.minDecibels = -85
                analyser.maxDecibels = -20

                const source = context.createMediaElementSource(audio)

                source.connect(analyser)
                analyser.connect(context.destination)

                audioContextRef.current = context
                analyserRef.current = analyser
            }

            if (audioContextRef.current.state !== "running") {
                await audioContextRef.current.resume()
            }
        } catch (err) {
            // Playback must remain possible even if the analyser fails.
            console.warn("Audio analyser unavailable:", err)
        }
    }

    // Stop visualizer
    const stopVisualizer = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        const allBars = [
            ...mobileBarRefs.current,
            ...desktopBarRefs.current,
        ]

        allBars.forEach((bar) => {
            if (!bar) return

            bar.style.transition =
                "height 850ms cubic-bezier(0.22, 1, 0.36, 1), opacity 850ms ease"

            bar.style.height = getComputedStyle(bar).height
        })

        requestAnimationFrame(() => {
            allBars.forEach((bar) => {
                if (!bar) return

                bar.style.height = "3px"
                bar.style.opacity = "0.35"
            })
        })
    }, [])

    // Visualizer
    const startVisualizer = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        const frequencyData = analyserRef.current
            ? new Uint8Array(analyserRef.current.frequencyBinCount)
            : null

        frameRef.current = 0

        const update = () => {
            const analyser = analyserRef.current

            if (analyser && frequencyData) {
                try {
                    analyser.getByteFrequencyData(frequencyData)
                } catch {
                    // Use fallback animation.
                }
            }

            const hasAudioData =
                frequencyData?.some((value) => value > 3) ?? false

            frameRef.current++

            for (let index = 0; index < BAR_COUNT; index++) {
                let normalized = 0

                if (hasAudioData && frequencyData) {
                    const start = Math.floor(
                        Math.pow(index / BAR_COUNT, 2) *
                        frequencyData.length
                    )

                    const end = Math.max(
                        start + 1,
                        Math.floor(
                            Math.pow((index + 1) / BAR_COUNT, 2) *
                            frequencyData.length
                        )
                    )

                    let sum = 0

                    for (let i = start; i < end; i++) {
                        sum += frequencyData[i]
                    }

                    normalized = (sum / (end - start)) / 255
                } else {
                    // Fallback animation for mobile browsers
                    // where audio frequency data is unavailable.
                    const time = frameRef.current * 0.11

                    normalized =
                        0.12 +
                        Math.abs(
                            Math.sin(time + index * 0.65) *
                            Math.cos(time * 0.7 + index * 0.3)
                        ) * 0.65
                }

                const height = 3 + Math.pow(normalized, 1.15) * 34
                const opacity = 0.4 + normalized * 0.6

                const bars = [
                    mobileBarRefs.current[index],
                    desktopBarRefs.current[index],
                ]

                bars.forEach((bar) => {
                    if (!bar) return

                    bar.style.transition =
                        "height 90ms linear, opacity 90ms linear"

                    bar.style.height = `${height}px`
                    bar.style.opacity = `${opacity}`
                })
            }

            animationFrameRef.current = requestAnimationFrame(update)
        }

        update()
    }, [])

    // Playback
    const togglePlayback = async () => {
        const audio = audioRef.current
        if (!audio) return

        if (!audio.paused) {
            audio.pause()
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await initializeAudioAnalyser()
            await audio.play()
        } catch (err) {
            console.error("Radio playback failed:", err)

            setError(
                err instanceof Error
                    ? err.message
                    : "Wiedergabe fehlgeschlagen"
            )

            setIsPlaying(false)
            setIsLoading(false)
            stopVisualizer()
        }
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            if (audioContextRef.current) {
                void audioContextRef.current.close()
            }
        }
    }, [])

    return (
        <>
            <audio
                ref={audioRef}
                crossOrigin="anonymous"
                src={STREAM_URL}
                preload="none"
                onPlay={() => {
                    setIsPlaying(true)
                    setIsLoading(false)
                    setError(null)
                    startVisualizer()
                }}
                onPause={() => {
                    setIsPlaying(false)
                    setIsLoading(false)
                    stopVisualizer()
                }}
                onPlaying={() => {
                    setIsPlaying(true)
                    setIsLoading(false)
                    startVisualizer()
                }}
                onError={(event) => {
                    const mediaError = event.currentTarget.error

                    console.error("Radio error:", mediaError)

                    setIsPlaying(false)
                    setIsLoading(false)
                    stopVisualizer()

                    setError(
                        `Fehler ${mediaError?.code ?? "unbekannt"}: ${
                            mediaError?.message ??
                            "Audio konnte nicht geladen werden."
                        }`
                    )
                }}
            />

            {/* Mobile bottom sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
                <div
                    className={`
                        relative mx-auto w-full max-w-[480px]
                        transition-transform duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        ${
                        isMobileOpen
                            ? "translate-y-0"
                            : "translate-y-[calc(100%-30px)]"
                    }
                    `}
                >
                    {/* Centered grabber */}
                    <div className="flex h-[30px] w-full justify-center">
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen((open) => !open)}
                            aria-label={
                                isMobileOpen
                                    ? "Radio-Player schließen"
                                    : "Radio-Player öffnen"
                            }
                            aria-expanded={isMobileOpen}
                            className="
                                radio-player-grabber
                                flex h-[30px] w-1/5 min-w-[64px]
                                items-center justify-center
                                rounded-t-2xl
                            "
                        >
                            <span className="
                                radio-player-grabber-line
                                h-1.5 w-12 max-w-[75%] rounded-full
                            " />
                        </button>
                    </div>

                    {/* Player */}
                    <div className="radio-player-shell rounded-t-3xl border-b">
                        <div className="radio-player-reflection" />
                        <div className="radio-player-glow" />

                        <div className="
                            relative flex flex-col items-center
                            gap-4 px-5 pb-5 pt-4
                        ">
                            {/* Track information */}
                            <div className="w-full min-w-0 text-center">
                                <h3 className="
                                    radio-player-title
                                    truncate font-serif text-lg font-medium
                                    tracking-wide
                                ">
                                    {track.title}
                                </h3>

                                <p className="
                                    radio-player-artist
                                    mt-1 truncate text-xs tracking-wide
                                ">
                                    {track.artist}
                                </p>
                            </div>

                            {/* Equalizer and playback */}
                            <div className="flex w-full items-center gap-4">
                                <div
                                    className="radio-equalizer min-w-0 flex-1"
                                    aria-label="Audio visualizer"
                                >
                                    {Array.from(
                                        { length: BAR_COUNT },
                                        (_, index) => (
                                            <div
                                                key={index}
                                                ref={(element) => {
                                                    mobileBarRefs.current[index] = element
                                                }}
                                                className="radio-equalizer-bar"
                                            />
                                        )
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={togglePlayback}
                                    disabled={isLoading}
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                    className="
                                        radio-player-mobile-button
                                        flex h-12 w-12 shrink-0
                                        items-center justify-center
                                        rounded-full
                                        transition-transform
                                        hover:scale-105 active:scale-95
                                        disabled:opacity-50
                                    "
                                >
                                    {isLoading ? (
                                        <span className="
                                            h-5 w-5 animate-spin rounded-full
                                            border-2 border-current/30
                                            border-t-current
                                        " />
                                    ) : isPlaying ? (
                                        <Pause className="h-5 w-5 fill-current" />
                                    ) : (
                                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                                    )}
                                </button>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="
                                    radio-player-error
                                    w-full border-t px-2 py-2
                                ">
                                    <p className="text-center text-xs">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="
                                radio-player-footer
                                flex w-full items-center justify-center
                                border-t pt-3
                            ">
                                <a
                                    href="https://somafm.com/groovesalad/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    <span className="
                                        font-sans text-[8px] font-medium
                                        tracking-[0.2em] opacity-65
                                    ">
                                        POWERED BY
                                    </span>

                                    <span className="
                                        radio-player-footer-brand
                                        font-serif text-[11px]
                                        tracking-[0.18em]
                                    ">
                                        SOMAFM
                                    </span>

                                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop player */}
            <div className="
                fixed bottom-5 left-1/2 z-50 hidden
                w-[min(96vw,780px)] -translate-x-1/2
                sm:block
            ">
                <div className="radio-player-shell rounded-2xl">
                    <div className="radio-player-reflection" />
                    <div className="radio-player-glow" />

                    <div className="
                        relative flex flex-row items-center gap-5 px-6 py-4
                    ">
                        {/* Track information */}
                        <div className="min-w-0 flex-[1.15]">
                            <h3 className="
                                radio-player-title
                                truncate font-serif text-lg font-medium
                                tracking-wide
                            ">
                                {track.title}
                            </h3>

                            <p className="
                                radio-player-artist
                                mt-1 truncate text-xs tracking-wide
                            ">
                                {track.artist}
                            </p>
                        </div>

                        {/* Equalizer */}
                        <div
                            className="radio-equalizer flex flex-initial"
                            aria-label="Audio visualizer"
                        >
                            {Array.from(
                                { length: BAR_COUNT },
                                (_, index) => (
                                    <div
                                        key={index}
                                        ref={(element) => {
                                            desktopBarRefs.current[index] = element
                                        }}
                                        className="radio-equalizer-bar"
                                    />
                                )
                            )}
                        </div>

                        {/* Play / Pause */}
                        <button
                            type="button"
                            onClick={togglePlayback}
                            disabled={isLoading}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            className="
                                radio-player-desktop-button
                                flex h-11 w-11 shrink-0 items-center
                                justify-center rounded-full
                                transition-all duration-300
                                active:scale-95 disabled:opacity-50
                            "
                        >
                            {isLoading ? (
                                <span className="
                                    h-4 w-4 animate-spin rounded-full
                                    border-2 border-current/30
                                    border-t-current
                                " />
                            ) : isPlaying ? (
                                <Pause className="h-4 w-4 fill-current" />
                            ) : (
                                <Play className="ml-0.5 h-4 w-4 fill-current" />
                            )}
                        </button>

                        {/* Volume */}
                        <div className="
                            radio-player-divider
                            flex shrink-0 items-center gap-2
                            border-l pl-4
                        ">
                            <button
                                type="button"
                                onClick={() =>
                                    handleVolumeChange(volume === 0 ? 65 : 0)
                                }
                                aria-label={volume === 0 ? "Unmute" : "Mute"}
                                className="
                                    radio-player-control
                                    flex h-10 w-9 items-center justify-center
                                "
                            >
                                {volume === 0 ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </button>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={volume}
                                onChange={(event) =>
                                    handleVolumeChange(
                                        Number(event.target.value)
                                    )
                                }
                                onInput={(event) =>
                                    handleVolumeChange(
                                        Number(event.currentTarget.value)
                                    )
                                }
                                aria-label="Volume"
                                className="
                                    radio-volume-slider
                                    relative z-10 w-16 cursor-pointer
                                "
                            />
                        </div>

                        {/* External link */}
                        <a
                            href="https://somafm.com/groovesalad/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open SomaFM Groove Salad"
                            className="
                                radio-player-divider
                                border-l pl-4
                                radio-player-control
                            "
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="
                        radio-player-footer
                        relative flex items-center justify-center
                        border-t bg-black/[0.08] px-4 py-2
                    ">
                        <a
                            href="https://somafm.com/groovesalad/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <span className="
                                text-[10px] font-medium
                                tracking-[0.2em] opacity-65
                            ">
                                Powered by
                            </span>

                            <span className="
                                radio-player-footer-brand
                                text-[12px] tracking-[0.18em]
                            ">
                                SomaFM
                            </span>

                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
