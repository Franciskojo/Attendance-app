"use client";

import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  Link as LinkIcon,
  Sparkles,
  QrCode,
  Share2,
} from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle: string;
  sessionSlug: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  sessionTitle,
  sessionSlug,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [attendanceUrl, setAttendanceUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  // Construct attendance URL safely on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAttendanceUrl(`${window.location.origin}/attendance/${sessionSlug}`);
    }
  }, [sessionSlug]);

  const handleCopyLink = async () => {
    if (!attendanceUrl) return;
    try {
      await navigator.clipboard.writeText(attendanceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${sessionSlug}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  // Fullscreen Classroom Projector Mode
  if (isProjectorMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-between p-6 sm:p-10 animate-fade-in overflow-y-auto">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between max-w-5xl">
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
              Live Classroom Projector Mode
            </span>
            <h1 className="text-2xl sm:text-4xl font-black mt-2 text-white tracking-tight">
              {sessionTitle}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Scan with your mobile camera or enter the link below to mark attendance
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsProjectorMode(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            <Minimize2 className="w-4 h-4" />
            Exit Projector
          </button>
        </div>

        {/* Center QR Display */}
        <div className="flex flex-col items-center justify-center my-6 max-w-full">
          <div
            ref={qrRef}
            className="p-6 sm:p-8 bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border-4 border-slate-700"
          >
            <QRCodeSVG
              value={attendanceUrl || "https://zobi.edu"}
              size={280}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Full Link Card for Projector */}
          <div className="mt-6 w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="overflow-hidden w-full">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Direct Attendance URL
              </span>
              <p className="text-white font-mono text-sm sm:text-base font-bold break-all select-all">
                {attendanceUrl}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="text-center text-slate-500 text-xs flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Attendance updates in real-time as students submit</span>
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance QR Code & Link"
      description="Scan with camera or share the direct link with students."
      maxWidth="2xl"
    >
      {/* Side-by-Side Compact Layout to fit on all laptop & tablet screens */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center py-1">
        {/* Left Column: QR Code + Action Buttons */}
        <div className="sm:col-span-5 flex flex-col items-center">
          <div
            ref={qrRef}
            className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center mb-3"
          >
            <QRCodeSVG
              value={attendanceUrl || "https://zobi.edu"}
              size={170}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              className="w-full text-xs font-semibold gap-1 py-1.5"
              title="Download QR code image"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              PNG
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsProjectorMode(true)}
              className="w-full text-xs font-bold gap-1 py-1.5 shadow-sm shadow-blue-500/20"
              title="Open full-screen classroom projector"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Projector
            </Button>
          </div>
        </div>

        {/* Right Column: Direct Link, Actions & Sharing */}
        <div className="sm:col-span-7 space-y-3.5">
          {/* Session Header Badge */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Lecture Session
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
              {sessionTitle}
            </h4>
          </div>

          {/* Direct Link Box with full visibility */}
          <div className="bg-slate-50 dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                Direct Check-In URL
              </span>
              {copied && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Copied!
                </span>
              )}
            </div>

            {/* Selectable Break-all Link Display */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 break-all select-all">
              {attendanceUrl}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                variant={copied ? "success" : "primary"}
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 text-xs font-bold gap-1.5 py-2 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </>
                )}
              </Button>

              <a
                href={attendanceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Open attendance page in a new browser tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open</span>
              </a>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Students can scan from their phone or click the direct link to check in.</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
