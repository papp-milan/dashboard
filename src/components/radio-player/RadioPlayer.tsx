
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
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

    const animationFrameRef = useRef<number | null>(null)
    const barRefs = useRef<(HTMLDivElement | null)[]>([])

    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [volume, setVolume] = useState(25)
    const [error, setError] = useState<string | null>(null)

    const [track, setTrack] = useState<Track>({
        title: "Groove Salad",
        artist: "SomaFM",
    })

    // Fetch current track metadata
    const fetchMetadata = useCallback(async () => {
        try {
            const response = await fetch(METADATA_URL, {
                cache: "no-store",
            })

            if (!response.ok) return

            const data: unknown = await response.json()
            const currentTrack = getTrack(data)

            if (currentTrack) {
                setTrack(currentTrack)
            }
        } catch {
            // Metadata is optional.
        }
    }, [])

    useEffect(() => {
        void fetchMetadata()

        const interval = window.setInterval(fetchMetadata, 30_000)

        return () => window.clearInterval(interval)
    }, [fetchMetadata])

    // Apply volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100
        }
    }, [volume])

    // Initialize Web Audio API
    const initializeAudioAnalyser = async () => {
        const audio = audioRef.current

        if (!audio) return

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
            sourceRef.current = source
        }

        if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume()
        }
    }

    // Stop visualizer updates.
    // The last inline heights remain in place so CSS can animate
    // every bar simultaneously back to its resting height.
    const stopVisualizer = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        // Aktuelle Höhen fixieren, damit der Übergang weich startet.
        barRefs.current.forEach((bar) => {
            if (!bar) return
            bar.style.height = getComputedStyle(bar).height
        })

        // Alle Balken gleichzeitig auf die Grundlinie zurückführen.
        requestAnimationFrame(() => {
            barRefs.current.forEach((bar) => {
                if (!bar) return
                bar.style.height = "3px"
                bar.style.opacity = "0.35"
            })
        })
    }, [])

    // Read actual audio frequencies and update the bars.
    const startVisualizer = useCallback(() => {
        const analyser = analyserRef.current

        if (!analyser) return

        stopVisualizer()

        const frequencyData = new Uint8Array(analyser.frequencyBinCount)

        const update = () => {
            analyser.getByteFrequencyData(frequencyData)

            for (let index = 0; index < BAR_COUNT; index++) {
                const bar = barRefs.current[index]

                if (!bar) continue

                // Logarithmic frequency distribution:
                // more detail in bass and mid frequencies.
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

                const average = sum / (end - start)

                // Convert frequency intensity into bar height.
                const normalized = average / 255
                const height = 3 + Math.pow(normalized, 1.15) * 34

                bar.style.height = `${height}px`
                bar.style.opacity = `${0.4 + normalized * 0.6}`
            }

            animationFrameRef.current = requestAnimationFrame(update)
        }

        update()
    }, [stopVisualizer])

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

    const handleVolumeChange = (value: number) => {
        setVolume(value)

        if (audioRef.current) {
            audioRef.current.volume = value / 100
        }
    }

    // Clean up animation and audio context.
    useEffect(() => {
        return () => {
            stopVisualizer()

            if (audioContextRef.current) {
                void audioContextRef.current.close()
            }
        }
    }, [stopVisualizer])

    return (
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(94vw,620px)] -translate-x-1/2">

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
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => {
                    setIsLoading(false)
                    setIsPlaying(true)
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

            <div className="overflow-hidden rounded-lg border border-[#967452]/50 bg-[#30271F]/95 shadow-[0_8px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl">

                {/* Main player */}
                <div className="flex items-center gap-4 px-4 py-4 sm:px-5">

                    {/* Track */}
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate font-serif text-lg font-semibold text-[#F4E5C9]">
                            {track.title}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-[#BBA68A]">
                            {track.artist}
                        </p>
                    </div>

                    {/* Real audio visualizer */}
                    <div className="radio-equalizer" aria-label="Audio visualizer">
                        {Array.from({ length: BAR_COUNT }, (_, index) => (
                            <div
                                key={index}
                                ref={(element) => {
                                    barRefs.current[index] = element
                                }}
                                className="radio-equalizer-bar"
                            />
                        ))}
                    </div>

                    {/* Playback */}
                    <button
                        type="button"
                        onClick={togglePlayback}
                        disabled={isLoading}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8C895] text-[#35291F] shadow-[0_3px_0_#98744D] transition hover:bg-[#F4DDB4] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
                    >
                        {isLoading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#6C5035]/30 border-t-[#6C5035]" />
                        ) : isPlaying ? (
                            <Pause className="h-4 w-4 fill-current" />
                        ) : (
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                        )}
                    </button>

                    {/* Volume */}
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                handleVolumeChange(volume === 0 ? 65 : 0)
                            }
                            aria-label={volume === 0 ? "Unmute" : "Mute"}
                            className="text-[#C6AF8D] transition hover:text-[#F0D6AC]"
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
                            value={volume}
                            onChange={(event) =>
                                handleVolumeChange(Number(event.target.value))
                            }
                            aria-label="Volume"
                            className="radio-volume-slider w-14 cursor-pointer sm:w-20"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="border-t border-red-400/20 px-4 py-2">
                        <p className="text-xs text-red-300">{error}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-center border-t border-[#80674D]/30 px-4 py-2">
                    <a
                        href="https://somafm.com/groovesalad/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-[#A99476] transition hover:text-[#E8C895]"
                    >
                        POWERED BY SOMAFM
                        <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                </div>
            </div>
        </div>
    )
}
