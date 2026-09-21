"use client";

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, Maximize2, Minimize2, ExternalLink } from "lucide-react";
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
  const qrRef = useRef<HTMLDivElement>(null);

  // Construct attendance URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const attendanceUrl = `${origin}/attendance/${sessionSlug}`;

  const handleCopyLink = async () => {
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

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isProjectorMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-between p-8 sm:p-12 animate-fade-in">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between max-w-6xl">
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
              Live Classroom Projector Mode
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-2 text-white tracking-tight">
              {sessionTitle}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Scan with your mobile camera to check in
            </p>
          </div>
          <button
            onClick={() => setIsProjectorMode(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
            Exit Projector
          </button>
        </div>

        {/* Center QR Display */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div
            ref={qrRef}
            className="p-8 bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border-4 border-slate-700"
          >
            <QRCodeSVG
              value={attendanceUrl}
              size={360}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-blue-400 font-mono text-lg mt-6 bg-slate-900/80 px-6 py-2.5 rounded-full border border-slate-800">
            {attendanceUrl}
          </p>
        </div>

        {/* Bottom hint */}
        <div className="text-center text-slate-500 text-sm">
          Attendance will update in real time on the dashboard
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session QR Code"
      description="Display or share this QR code for students to record their attendance."
      maxWidth="md"
    >
      <div className="flex flex-col items-center">
        {/* QR Code Card */}
        <div
          ref={qrRef}
          className="p-6 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm my-3"
        >
          <QRCodeSVG
            value={attendanceUrl}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* URL Box */}
        <div className="w-full mt-3 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate select-all">
            {attendanceUrl}
          </span>
          <a
            href={attendanceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mt-5">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="w-full text-xs sm:text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadQR}
            className="w-full text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </Button>
        </div>

        {/* Fullscreen Projector Button */}
        <Button
          variant="secondary"
          onClick={() => setIsProjectorMode(true)}
          className="w-full mt-3 gap-2"
        >
          <Maximize2 className="w-4 h-4 text-blue-400" />
          Fullscreen Projector Mode
        </Button>
      </div>
    </Modal>
  );
}
