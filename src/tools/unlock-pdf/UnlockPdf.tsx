import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileArchive,
  FileCheck,
  FileText,
  Globe,
  HardDriveDownload,
  KeyRound,
  Layers,
  Lock,
  LockOpen,
  Printer,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Upload,
  Video,
  Zap,
} from 'lucide-react'
import {
  formatBytes,
  inspectPdfFile,
  unlockPdfFile,
  downloadUnlockedPdf,
  type InspectResult,
} from './unlockPdfEngine'
import type { DecryptStatus } from './types'
import './UnlockPdf.css'

export default function UnlockPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<DecryptStatus>('idle')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [consentChecked, setConsentChecked] = useState(true)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [inspectInfo, setInspectInfo] = useState<InspectResult | null>(null)
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null)
  const [unlockedSize, setUnlockedSize] = useState<number>(0)
  const [pageCount, setPageCount] = useState<number>(0)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file (.pdf).')
      return
    }

    setFile(selectedFile)
    setStatus('inspecting')
    setError('')
    setPassword('')

    try {
      const info = await inspectPdfFile(selectedFile)
      setInspectInfo(info)

      if (!info.isEncrypted) {
        setStatus('already_unlocked')
        if (info.pageCount) setPageCount(info.pageCount)
      } else if (!info.requiresPassword) {
        // Permissions lock only (owner password): ready to unlock with 1 click!
        setStatus('ready_to_unlock')
        if (info.pageCount) setPageCount(info.pageCount)
      } else {
        // Open password required
        setStatus('needs_password')
      }
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not inspect the PDF file.')
    }
  }

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      void handleFileSelection(files[0])
    }
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = () => {
    setIsDragOver(false)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleUnlock = async () => {
    if (!file) return
    if (!consentChecked) {
      setError('Please confirm that you have the authorization to unlock this file.')
      return
    }

    setStatus('decrypting')
    setError('')

    try {
      const result = await unlockPdfFile(file, password)
      const blob = new Blob([result.unlockedBytes as BlobPart], { type: 'application/pdf' })
      setUnlockedBlob(blob)
      setUnlockedSize(blob.size)
      setPageCount(result.pageCount)
      setStatus('unlocked')
    } catch (err: unknown) {
      setStatus('needs_password')
      setError(err instanceof Error ? err.message : 'Failed to unlock PDF. Please verify password.')
    }
  }

  const handleDownload = () => {
    if (!unlockedBlob || !file) return
    downloadUnlockedPdf(unlockedBlob, file.name)
  }

  const handleReset = () => {
    setFile(null)
    setStatus('idle')
    setPassword('')
    setError('')
    setInspectInfo(null)
    setUnlockedBlob(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx)
  }

  return (
    <div className="unlock-pdf-page">
      <div className="up-container">
        {/* ================================================================
            1. HERO TITLE & SHORT INTRODUCTION (Compact: Tool above fold)
            ================================================================ */}
        <header className="up-hero-header">
          <h1 className="up-hero-title">
            Unlock <span className="up-gradient-word">PDF</span> – Remove PDF Password Online
          </h1>
          <p className="up-hero-intro">
            Instantly remove passwords, printing restrictions, and copying permissions from your protected PDF documents—100% private in your browser.
          </p>

          <div className="up-pills-row">
            <span className="up-pill-tag">
              <ShieldCheck size={13} /> 100% Client-Side Privacy
            </span>
            <span className="up-pill-tag">
              <Zap size={13} /> Instant Web Crypto
            </span>
            <span className="up-pill-tag">
              <LockOpen size={13} /> Strips Owner &amp; User Passwords
            </span>
            <span className="up-pill-tag">
              <Printer size={13} /> Restores Printing &amp; Copying
            </span>
            <span className="up-pill-tag">
              <HardDriveDownload size={13} /> Zero File Size Limits
            </span>
          </div>
        </header>

        {/* ================================================================
            2. APPLICATION WORKSPACE (Interactive Widget)
            ================================================================ */}
        <div className="up-app-wrapper">
          <div className="up-app-toolbar">
            <div className="up-app-toolbar-title">
              <span className="up-app-toolbar-dot" />
              <span>PDF Security &amp; Decryption Engine</span>
            </div>
            <div className="up-privacy-shield">
              <ShieldCheck size={13} />
              <span>Zero-Server Uploads</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileInputChange}
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
          />

          {/* STAGE 1: Dropzone (Idle or Inspecting) */}
          {status === 'idle' && (
            <div
              className={`up-dropzone ${isDragOver ? 'up-dragover' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload PDF file"
            >
              <div className="up-drop-icon-box">
                <LockOpen size={34} />
              </div>
              <h2>Drop your protected PDF here</h2>
              <p>Drag and drop your password-protected PDF document, or click to browse files from your computer.</p>
              <button type="button" className="up-choose-btn">
                <Upload size={16} /> Choose PDF File
              </button>
              <span className="up-drop-notice">
                <ShieldCheck size={14} /> All files are decrypted locally in your browser memory. No data is sent to any server.
              </span>
            </div>
          )}

          {/* STAGE 1B: Inspecting Spinner */}
          {status === 'inspecting' && (
            <div className="up-processing-box">
              <div className="up-spinner-ring" />
              <h3>Analyzing PDF Security…</h3>
              <p>Detecting encryption algorithms (AES-128, AES-256, RC4) and permission restrictions.</p>
            </div>
          )}

          {/* STAGE 2: Password Entry or Ready to Unlock */}
          {(status === 'needs_password' || status === 'ready_to_unlock') && file && (
            <div className="up-action-card">
              <div className="up-file-summary-bar">
                <div className="up-file-left">
                  <div className="up-file-icon">
                    <FileText size={24} />
                  </div>
                  <div className="up-file-details">
                    <span className="up-file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="up-file-size">
                      {formatBytes(file.size)}
                      {pageCount > 0 ? ` · ${pageCount} Pages` : ''}
                    </span>
                  </div>
                </div>

                <div className="up-file-badges">
                  {status === 'ready_to_unlock' ? (
                    <span className="up-tag-pill success">
                      <LockOpen size={12} /> Permissions Lock Only (No Password Needed)
                    </span>
                  ) : (
                    <span className="up-badge-lock">
                      <Lock size={12} /> Password Protected
                    </span>
                  )}
                  {inspectInfo?.encryptionInfo?.algorithm && (
                    <span className="up-badge-algo">
                      {inspectInfo.encryptionInfo.algorithm}
                      {inspectInfo.encryptionInfo.keyLength ? ` (${inspectInfo.encryptionInfo.keyLength}-bit)` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Password Panel if User Password is Required */}
              {status === 'needs_password' && (
                <div className="up-password-panel">
                  <div className="up-password-header">
                    <h3>Enter PDF Password</h3>
                    <p>This document is protected with an Open Password. Enter the password below to remove it permanently.</p>
                  </div>

                  <div className="up-password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Type PDF password here…"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && password.trim()) void handleUnlock()
                      }}
                    />
                    <button
                      type="button"
                      className="up-password-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Ready to unlock note for permissions lock */}
              {status === 'ready_to_unlock' && (
                <div className="up-password-panel" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <div className="up-password-header">
                    <h3 style={{ color: '#166534' }}>
                      <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
                      Direct Unlock Available
                    </h3>
                    <p style={{ color: '#15803d' }}>
                      This file only has editing, printing, or copying permissions restrictions. You do not need to enter a
                      password. Click <strong>Unlock PDF</strong> to strip all restrictions instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Consent check */}
              <label className="up-consent-check">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span>
                  I have the right or authorization to unlock, edit, and access the contents of this PDF file.
                </span>
              </label>

              {/* Actions */}
              <div className="up-action-buttons">
                <button
                  type="button"
                  className="up-btn-unlock"
                  onClick={() => void handleUnlock()}
                  disabled={status === 'needs_password' && !password.trim()}
                >
                  <LockOpen size={16} /> Unlock PDF
                </button>
                <button type="button" className="up-btn-cancel" onClick={handleReset}>
                  Choose Another File
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: Decrypting Progress */}
          {status === 'decrypting' && (
            <div className="up-processing-box">
              <div className="up-spinner-ring" />
              <h3>Decrypting Document…</h3>
              <p>Decrypting content streams and generating an unprotected, clean PDF.</p>
            </div>
          )}

          {/* STAGE 4: Success & Download */}
          {status === 'unlocked' && file && (
            <div className="up-success-box">
              <div className="up-success-badge">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3>PDF Successfully Unlocked!</h3>
              <p>
                All passwords, print blocks, copy restrictions, and encryption keys have been completely removed.
                Your PDF is now 100% open and unrestricted.
              </p>

              <div className="up-unlocked-card">
                <div className="up-file-left">
                  <div className="up-file-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <FileCheck size={26} />
                  </div>
                  <div className="up-unlocked-info">
                    <span className="up-unlocked-name">{file.name.replace(/\.[^/.]+$/, '')}_unlocked.pdf</span>
                    <span className="up-unlocked-meta">
                      <span>{formatBytes(unlockedSize)}</span>
                      <span>·</span>
                      <span>{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
                      <span>·</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>Unrestricted</span>
                    </span>
                  </div>
                </div>

                <span className="up-tag-pill success">
                  <CheckCircle2 size={12} /> Ready to Download
                </span>
              </div>

              <div className="up-download-actions">
                <button type="button" className="up-btn-download" onClick={handleDownload}>
                  <Download size={17} /> Download Unlocked PDF
                </button>
                <button type="button" className="up-btn-again" onClick={handleReset}>
                  <RotateCcw size={15} /> Unlock Another PDF
                </button>
              </div>
            </div>
          )}

          {/* STAGE 5: Already Unlocked */}
          {status === 'already_unlocked' && file && (
            <div className="up-success-box">
              <div className="up-success-badge" style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#2563eb' }}>
                <BadgeCheck size={40} />
              </div>
              <h3 style={{ color: '#1e40af' }}>This PDF is Already Unlocked!</h3>
              <p>
                The selected PDF file has no password protection or security restrictions. You can freely open, print, and
                copy text from this document without any modifications.
              </p>
              <div className="up-download-actions">
                <button type="button" className="up-btn-again" onClick={handleReset}>
                  <RotateCcw size={15} /> Choose a Protected PDF
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="up-error-alert" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ================================================================
            3. HOW TO UNLOCK A PDF ONLINE (Step-by-Step Workflow)
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-steps-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">STEP-BY-STEP WORKFLOW</span>
            <h2 id="up-steps-heading">How to Remove Passwords from a PDF Online</h2>
            <p>
              Follow this straightforward 4-step tutorial to unlock your protected PDF files without installing desktop software:
            </p>
          </div>

          <div className="up-steps-grid">
            <div className="up-step-card">
              <span className="up-step-num">01</span>
              <h3>Upload Your File</h3>
              <p>
                Drag and drop your protected PDF into the upload zone above, or select it directly from your device storage.
              </p>
            </div>

            <div className="up-step-card">
              <span className="up-step-num">02</span>
              <h3>Enter Password</h3>
              <p>
                If your document requires an Open Password, enter it once. If it only has an Owner/Permissions lock, no
                password is required!
              </p>
            </div>

            <div className="up-step-card">
              <span className="up-step-num">03</span>
              <h3>Instant Decryption</h3>
              <p>
                Our high-performance Web Crypto engine strips encryption dictionaries and restriction flags in less than two
                seconds.
              </p>
            </div>

            <div className="up-step-card">
              <span className="up-step-num">04</span>
              <h3>Download Clean PDF</h3>
              <p>
                Download your unlocked PDF file immediately. You can now view, copy, print, annotate, and share without any
                passwords.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            4. OWNER PASSWORD VS USER PASSWORD (Educational Deep Dive)
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-pw-types-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">SECURITY ARCHITECTURE</span>
            <h2 id="up-pw-types-heading">Understanding PDF Password Types &amp; Encryption</h2>
            <p>
              PDF documents employ two distinct layers of security defined by the Adobe PDF specification. Here is how they
              differ and how ImgMojo handles each:
            </p>
          </div>

          <div className="up-pw-types-grid">
            <div className="up-pw-card owner">
              <div className="up-pw-card-icon">
                <Printer size={24} />
              </div>
              <h3>1. Owner / Permissions Password</h3>
              <p>
                Set by authors to prevent unauthorized modifications. The document can typically be opened and read without
                a password, but certain operations are locked down:
              </p>
              <ul className="up-pw-list">
                <li>
                  <Check size={14} /> <strong>Printing Blocks:</strong> Low-res printing only or completely disabled.
                </li>
                <li>
                  <Check size={14} /> <strong>Content Copying:</strong> Copying text, tables, and images is blocked.
                </li>
                <li>
                  <Check size={14} /> <strong>Editing &amp; Annotations:</strong> Form filling and commenting are prohibited.
                </li>
                <li>
                  <Check size={14} /> <strong>Page Extraction:</strong> Extracting, rotating, or deleting pages is locked.
                </li>
              </ul>
              <p style={{ marginTop: 'auto', fontSize: 12, color: 'var(--up-brand)' }}>
                <strong>ImgMojo Advantage:</strong> We remove Owner Passwords automatically without prompting you for a
                password!
              </p>
            </div>

            <div className="up-pw-card user">
              <div className="up-pw-card-icon">
                <KeyRound size={24} />
              </div>
              <h3>2. User / Open Password</h3>
              <p>
                Applied to confidential documents such as financial statements, tax reports, medical records, and legal contracts.
                The entire file is encrypted with symmetric keys:
              </p>
              <ul className="up-pw-list">
                <li>
                  <Check size={14} /> <strong>Full Encryption:</strong> The PDF body cannot be viewed without the secret key.
                </li>
                <li>
                  <Check size={14} /> <strong>AES-128 &amp; AES-256:</strong> Industrial-strength Advanced Encryption Standard.
                </li>
                <li>
                  <Check size={14} /> <strong>RC4 Legacy Ciphers:</strong> Supported across historical PDF versions (Acrobat 3 to 7).
                </li>
                <li>
                  <Check size={14} /> <strong>Permanent Removal:</strong> Enter the password once to produce a clean, unlocked PDF.
                </li>
              </ul>
              <p style={{ marginTop: 'auto', fontSize: 12, color: 'var(--up-amber)' }}>
                <strong>ImgMojo Advantage:</strong> Once entered, the encryption layer is stripped so you never have to type the
                password again.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            5. WHY UNLOCK YOUR PDF? (Common Use Cases)
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-usecases-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">PRACTICAL USE CASES</span>
            <h2 id="up-usecases-heading">When Should You Use an Online PDF Password Remover?</h2>
            <p>
              Unlocking PDFs solves everyday friction across personal, educational, legal, and business workflows:
            </p>
          </div>

          <div className="up-usecases-grid">
            <div className="up-usecase-card">
              <div className="up-usecase-icon">
                <Printer size={22} />
              </div>
              <h3>Unlocking Bank &amp; Tax Statements</h3>
              <p>
                Financial institutions frequently protect statements with birthdates or account numbers. Unlocking them
                allows you to print, archive, and import them into accounting tools effortlessly.
              </p>
            </div>

            <div className="up-usecase-card">
              <div className="up-usecase-icon">
                <FileText size={22} />
              </div>
              <h3>Copying Text for Research &amp; Study</h3>
              <p>
                Academic papers and whitepapers often restrict text selection. Removing permissions lock lets students and
                researchers copy citations and excerpts into word processors.
              </p>
            </div>

            <div className="up-usecase-card">
              <div className="up-usecase-icon">
                <Layers size={22} />
              </div>
              <h3>Merging &amp; Organizing Multiple Documents</h3>
              <p>
                Most PDF combiner tools fail when encountering password-protected files. Unlock each document first to merge,
                split, and reorder pages smoothly.
              </p>
            </div>

            <div className="up-usecase-card">
              <div className="up-usecase-icon">
                <Zap size={22} />
              </div>
              <h3>Streamlining Team Collaboration</h3>
              <p>
                Repeatedly sharing passwords across remote team members slows down productivity. Remove the password before
                distributing approved drafts for team review.
              </p>
            </div>

            <div className="up-usecase-card">
              <div className="up-usecase-icon">
                <Clock size={22} />
              </div>
              <h3>Long-Term Digital Archiving</h3>
              <p>
                Proprietary passwords can be forgotten over years. Storing restriction-free PDF/A archives guarantees that
                important family or business documents remain accessible in the future.
              </p>
            </div>

            <div className="up-usecase-card">
              <div className="up-usecase-icon">
                <Globe size={22} />
              </div>
              <h3>Seamless Mobile &amp; E-Reader Viewing</h3>
              <p>
                Many Kindle, iPad, and e-reader apps do not support encrypted PDF passwords. Unlocked PDFs open instantly
                without annoying authentication dialogs.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            6. BROWSER & PLATFORM COMPATIBILITY MATRIX
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-compat-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">CROSS-PLATFORM SUPPORT</span>
            <h2 id="up-compat-heading">Browser &amp; Operating System Compatibility</h2>
            <p>
              ImgMojo operates entirely on standardized W3C Web Cryptography APIs, ensuring flawless performance across all
              devices:
            </p>
          </div>

          <div className="up-table-wrap">
            <table className="up-table">
              <thead>
                <tr>
                  <th>Platform / Browser</th>
                  <th>Operating Systems</th>
                  <th>Supported Ciphers</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Google Chrome</strong> (v74+)
                  </td>
                  <td>Windows, macOS, Linux, ChromeOS, Android</td>
                  <td>AES-256, AES-128, RC4 (40-bit &amp; 128-bit)</td>
                  <td>
                    <span className="up-tag-pill success">
                      <CheckCircle2 size={12} /> Full Support
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Apple Safari</strong> (v13+)
                  </td>
                  <td>iOS, iPadOS, macOS</td>
                  <td>AES-256, AES-128, RC4</td>
                  <td>
                    <span className="up-tag-pill success">
                      <CheckCircle2 size={12} /> Full Support
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Microsoft Edge</strong> (v79+)
                  </td>
                  <td>Windows 10/11, macOS, Linux</td>
                  <td>AES-256, AES-128, RC4</td>
                  <td>
                    <span className="up-tag-pill success">
                      <CheckCircle2 size={12} /> Full Support
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Mozilla Firefox</strong> (v68+)
                  </td>
                  <td>Windows, macOS, Linux, Android</td>
                  <td>AES-256, AES-128, RC4</td>
                  <td>
                    <span className="up-tag-pill success">
                      <CheckCircle2 size={12} /> Full Support
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Opera &amp; Brave</strong> (Current)
                  </td>
                  <td>All Desktop &amp; Mobile OS</td>
                  <td>AES-256, AES-128, RC4</td>
                  <td>
                    <span className="up-tag-pill success">
                      <CheckCircle2 size={12} /> Full Support
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================================================================
            7. COMPARISON TABLE: IMGMOJO VS OTHER TOOLS
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-compare-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">FEATURE BENCHMARK</span>
            <h2 id="up-compare-heading">ImgMojo vs Traditional Online PDF Unlockers</h2>
            <p>
              Compare how ImgMojo’s in-browser cryptographic engine stacks up against standard cloud conversion websites:
            </p>
          </div>

          <div className="up-table-wrap">
            <table className="up-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>ImgMojo Unlock PDF</th>
                  <th>Smallpdf (Free Tier)</th>
                  <th>iLovePDF (Free Tier)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Privacy &amp; Security</strong>
                  </td>
                  <td>
                    <span className="up-tag-pill success">100% In-Browser (Zero Uploads)</span>
                  </td>
                  <td>Uploaded to Cloud Server</td>
                  <td>Uploaded to Cloud Server</td>
                </tr>
                <tr>
                  <td>
                    <strong>Daily Usage Limits</strong>
                  </td>
                  <td>
                    <span className="up-tag-pill success">Unlimited Free Unlocks</span>
                  </td>
                  <td>2 tasks per day</td>
                  <td>Limited tasks / hourly cooldown</td>
                </tr>
                <tr>
                  <td>
                    <strong>File Size Restrictions</strong>
                  </td>
                  <td>
                    <span className="up-tag-pill success">No Arbitrary Limits</span>
                  </td>
                  <td>Max 5 MB on free plan</td>
                  <td>Max 15 MB on free plan</td>
                </tr>
                <tr>
                  <td>
                    <strong>Owner Restrictions Removal</strong>
                  </td>
                  <td>
                    <span className="up-tag-pill success">Automatic (No Password Needed)</span>
                  </td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>
                    <strong>AES-256 Bit Support</strong>
                  </td>
                  <td>
                    <span className="up-tag-pill success">Full Support (Web Crypto)</span>
                  </td>
                  <td>Supported</td>
                  <td>Supported</td>
                </tr>
                <tr>
                  <td>
                    <strong>Required Registration</strong>
                  </td>
                  <td>
                    <span className="up-tag-pill success">Zero Sign-Up Needed</span>
                  </td>
                  <td>Account prompted</td>
                  <td>Account prompted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================================================================
            8. FREQUENTLY ASKED QUESTIONS (FAQ Accordion)
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-faq-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">CLEAR ANSWERS</span>
            <h2 id="up-faq-heading">Frequently Asked Questions About Unlocking PDFs</h2>
            <p>
              Find answers to common inquiries regarding PDF passwords, legal rights, encryption standards, and data security:
            </p>
          </div>

          <div className="up-faq-list">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div key={idx} className={`up-faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="up-faq-question"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  {isOpen && <div className="up-faq-answer">{faq.a}</div>}
                </div>
              )
            })}
          </div>
        </section>

        {/* ================================================================
            9. EXPLORE RELATED CREATIVE & UTILITY TOOLS
            ================================================================ */}
        <section className="up-section" aria-labelledby="up-related-heading">
          <div className="up-section-head">
            <span className="up-section-kicker">COMPLETE TOOLKIT</span>
            <h2 id="up-related-heading">Explore More Free Creative Tools on ImgMojo</h2>
            <p>
              ImgMojo provides a comprehensive suite of high-speed multimedia and productivity utilities:
            </p>
          </div>

          <div className="up-tools-grid">
            <Link to="/compress-image" className="up-tool-card">
              <div className="up-tool-icon-mini">
                <FileArchive size={18} />
              </div>
              <strong>Compress Image</strong>
              <span>Shrink JPG, PNG and WebP files by up to 80% without quality loss.</span>
            </Link>

            <Link to="/qr-code" className="up-tool-card">
              <div className="up-tool-icon-mini">
                <QrCode size={18} />
              </div>
              <strong>QR Code Generator</strong>
              <span>Generate customized QR codes for URLs, text, Wi-Fi networks, and contact cards.</span>
            </Link>

            <Link to="/Recorder" className="up-tool-card">
              <div className="up-tool-icon-mini">
                <Video size={18} />
              </div>
              <strong>Screen Recorder</strong>
              <span>Record desktop screen, windows, browser tabs, and webcam audio in HD.</span>
            </Link>

            <Link to="/store?type=pdf" className="up-tool-card">
              <div className="up-tool-icon-mini">
                <FileText size={18} />
              </div>
              <strong>Digital PDF Store</strong>
              <span>Explore curated digital templates, planners, guides, and creative workbooks.</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    q: 'How does ImgMojo unlock my PDF file without uploading it to a server?',
    a: 'Unlike traditional web converters that transmit your files to cloud servers, ImgMojo executes all cryptographic operations locally inside your web browser using modern WebAssembly and the W3C Web Cryptography API. Your PDF binary data remains completely in your computer’s RAM memory and never traverses the internet, guaranteeing 100% privacy for sensitive documents.',
  },
  {
    q: 'What is the difference between an Owner Password and a User Password?',
    a: 'A User Password (or Open Password) encrypts the entire document body, meaning the file cannot be opened or viewed without typing the password. An Owner Password (or Permissions Password) allows the document to be opened, but restricts features such as high-resolution printing, copying text, editing forms, or extracting pages. ImgMojo removes Owner Passwords automatically without prompting you for a key.',
  },
  {
    q: 'Can ImgMojo remove the password if I completely forgot the User Password?',
    a: 'Modern AES-256 and AES-128 ciphers are mathematically unbreakable without the correct decryption key. To unlock an Open Password-protected file, you must enter the password once. Our tool verifies and applies the decryption algorithm, strips the encryption tables permanently, and exports an unprotected PDF so you never have to type it again.',
  },
  {
    q: 'Is it legal to remove passwords and permissions from a PDF file?',
    a: 'Yes, provided that you are the author, rightful owner, or have explicit authorization from the copyright holder to modify and access the document. Common legal scenarios include unlocking your own bank statements, tax documents, academic research papers, or work files where security restrictions interfere with printing or archival.',
  },
  {
    q: 'Will unlocking my PDF alter the visual layout, images, or formatting?',
    a: 'Not at all. ImgMojo decrypts the underlying binary object streams and reconstructs the PDF file according to the ISO 32000 standard. All vector shapes, embedded fonts, high-resolution photographs, metadata, bookmarks, and page layouts are preserved with 100% fidelity.',
  },
  {
    q: 'Are there any file size limits or hidden subscription charges?',
    a: 'No. ImgMojo Unlock PDF is completely free with zero subscription requirements, time limits, or arbitrary file size caps. Because processing takes place on your own hardware, you can unlock large catalogs, e-books, and portfolios as long as your device has sufficient memory.',
  },
  {
    q: 'Which encryption algorithms are supported by the unlocker?',
    a: 'Our engine supports all standardized PDF encryption algorithms including RC4 (40-bit and 128-bit used in Acrobat 3 to 6), AES-128 (introduced in Acrobat 7), and industrial AES-256 (introduced in Acrobat 9 / PDF 1.7 Extension Level 3 and ISO 32000-2).',
  },
  {
    q: 'Can I use this tool on my iPhone, iPad, or Android phone?',
    a: 'Yes. The tool is fully responsive and compatible with mobile web browsers including Mobile Safari on iOS and Chrome on Android. You can select PDF documents directly from your iCloud Drive, Google Drive, or local device storage.',
  },
]
