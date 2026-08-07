'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Checkbox } from '@imkon/ui';

interface QualityLevel {
  index: number;
  label: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DATA_SAVER_KEY = 'imkon-data-saver';
const WATERMARK_POSITIONS = [
  'left-3 top-3',
  'right-3 top-3',
  'left-3 bottom-12',
  'right-3 bottom-12',
  'left-1/3 top-3',
  'right-1/3 bottom-12',
];
const WATERMARK_INTERVAL_MS = 30_000;

function lowestQualityIndex(levels: { height: number }[]): number {
  let lowest = 0;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i]!.height < levels[lowest]!.height) lowest = i;
  }
  return lowest;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function VideoPlayer({
  hlsUrl,
  subtitleUrl,
  title,
  watermarkName,
  watermarkPhone,
}: {
  hlsUrl: string;
  subtitleUrl: string | null;
  title: string;
  watermarkName?: string | null;
  watermarkPhone?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [quality, setQuality] = useState(-1); // -1 = avto
  const [speed, setSpeed] = useState(1);
  const [dataSaver, setDataSaver] = useState(false);
  const [watermarkIndex, setWatermarkIndex] = useState(0);

  useEffect(() => {
    setDataSaver(
      typeof window !== 'undefined' && window.localStorage.getItem(DATA_SAVER_KEY) === '1',
    );
  }, []);

  useEffect(() => {
    if (!watermarkName) return;
    const id = setInterval(() => {
      setWatermarkIndex((i) => (i + 1) % WATERMARK_POSITIONS.length);
    }, WATERMARK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [watermarkName]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hls.levels.map((l, i) => ({ index: i, label: `${l.height}p` })));
        if (dataSaver) {
          const lowest = lowestQualityIndex(hls.levels);
          hls.currentLevel = lowest;
          setQuality(lowest);
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Safari — native HLS
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    }
    return undefined;
  }, [hlsUrl]);

  function changeQuality(index: number) {
    setQuality(index);
    if (hlsRef.current) hlsRef.current.currentLevel = index;
  }

  function toggleDataSaver(checked: boolean) {
    setDataSaver(checked);
    window.localStorage.setItem(DATA_SAVER_KEY, checked ? '1' : '0');
    if (checked && hlsRef.current && hlsRef.current.levels.length > 0) {
      changeQuality(lowestQualityIndex(hlsRef.current.levels));
    }
  }

  function changeSpeed(rate: number) {
    setSpeed(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-black">
      {/* Subtitr ustoz yuklaganda (subtitle_url) biriktiriladi; statik lint buni ko'rmaydi. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black"
        aria-label={`Video dars: ${title}`}
      >
        {subtitleUrl && (
          <track kind="subtitles" src={subtitleUrl} srcLang="uz" label="O‘zbekcha" default />
        )}
      </video>

      {watermarkName && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute select-none rounded bg-black/30 px-2 py-1 font-mono text-xs text-white/20 ${WATERMARK_POSITIONS[watermarkIndex]}`}
        >
          {watermarkName}
          {watermarkPhone ? ` · ${maskPhone(watermarkPhone)}` : ''}
        </div>
      )}

      {/* Qo'shimcha boshqaruv — tezlik, sifat va trafik tejash */}
      <div className="flex flex-wrap items-center gap-4 bg-paper px-3 py-2">
        <label className="flex items-center gap-2 font-sans text-base text-ink">
          Tezlik
          <select
            value={speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="min-h-touch rounded border border-line bg-paper px-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>

        {levels.length > 0 && (
          <label className="flex items-center gap-2 font-sans text-base text-ink">
            Sifat
            <select
              value={quality}
              onChange={(e) => changeQuality(Number(e.target.value))}
              disabled={dataSaver}
              className="min-h-touch rounded border border-line bg-paper px-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <option value={-1}>Avto</option>
              {levels.map((l) => (
                <option key={l.index} value={l.index}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <Checkbox
          label="Trafik tejash rejimi"
          checked={dataSaver}
          onChange={(e) => toggleDataSaver(e.target.checked)}
        />
      </div>
    </div>
  );
}
