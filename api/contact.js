import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const DATA_DIR = fileURLToPath(new URL('../data', import.meta.url))
const INBOX_FILE = path.join(DATA_DIR, 'contact-inbox.json')

function getStoredMessages() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (fs.existsSync(INBOX_FILE)) {
      const content = fs.readFileSync(INBOX_FILE, 'utf-8').trim()
      if (content) {
        return JSON.parse(content)
      }
    }
  } catch (err) {
    console.error('[Contact Storage Read Error]', err)
  }
  return []
}

function saveMessage(entry) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const list = getStoredMessages()
    list.unshift(entry)
    fs.writeFileSync(INBOX_FILE, JSON.stringify(list, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('[Contact Storage Write Error]', err)
    return false
  }
}

export default async function sendContactMailHandler(req, res, env = {}) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' })
  }

  const { name, email, phone, subject, category, message } = req.body || {}

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' })
  }

  const recipient = env.CONTACT_EMAIL || env.VITE_SUPPORT_EMAIL || 'imgmojo@gmail.com'
  const timeStr = new Date().toISOString()
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const entry = {
    id: msgId,
    receivedAt: timeStr,
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : null,
    category: category || 'General Enquiries',
    subject: subject ? String(subject).trim() : 'Website Enquiry',
    message: String(message).trim(),
    recipient,
    deliveryStatus: 'received_local',
  }

  // Save to local inbox file so inquiries are never lost in local development
  const saved = saveMessage(entry)

  console.log('----------------------------------------------------')
  console.log(`[Contact Form Received #${msgId}]`)
  console.log(`  From: ${entry.name} <${entry.email}> (${entry.phone || 'No phone'})`)
  console.log(`  Category: ${entry.category} | Subject: ${entry.subject}`)
  console.log(`  Message: ${entry.message}`)
  console.log(`  Target: ${recipient} at ${timeStr}`)
  console.log(`  Local Inbox Saved: ${saved ? INBOX_FILE : 'Failed to save'}`)

  // Direct webmail compose links
  const subjectText = `[ImgMojo ${entry.category}] ${entry.subject}`
  const bodyText = `Name: ${entry.name}\nEmail: ${entry.email}\nPhone: ${entry.phone || 'N/A'}\nCategory: ${entry.category}\n\nMessage:\n${entry.message}`
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`

  let mailDispatched = false
  let smtpError = null

  // Check if SMTP credentials are provided in .env
  const smtpUser = env.SMTP_USER || env.GMAIL_USER
  const smtpPass = env.SMTP_PASS || env.GMAIL_APP_PASS

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(env.SMTP_PORT) || 465,
        secure: env.SMTP_SECURE === 'false' ? false : (Number(env.SMTP_PORT) === 465 || !env.SMTP_PORT),
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
          <div style="border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">New ImgMojo Contact Inquiry</h2>
            <span style="font-size: 13px; color: #64748b;">${new Date().toLocaleString()}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #64748b; width: 110px;"><strong>Name:</strong></td><td style="padding: 6px 0; color: #0f172a;">${entry.name}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${entry.email}">${entry.email}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="padding: 6px 0; color: #0f172a;">${entry.phone || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Category:</strong></td><td style="padding: 6px 0; color: #0f172a;">${entry.category}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Subject:</strong></td><td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${entry.subject}</td></tr>
          </table>
          <div style="background: #f8fafc; border-left: 4px solid #ea580c; padding: 14px 16px; border-radius: 4px; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${entry.message}</div>
          <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            Sent from ImgMojo Website Contact Form &bull; Ref: ${msgId}
          </div>
        </div>
      `

      const info = await transporter.sendMail({
        from: `"ImgMojo Website" <${smtpUser}>`,
        replyTo: `"${entry.name}" <${entry.email}>`,
        to: recipient,
        subject: subjectText,
        text: bodyText,
        html: htmlBody,
      })

      mailDispatched = true
      entry.deliveryStatus = 'sent_via_smtp'
      console.log(`[Contact Form SMTP Success] Message sent to ${recipient}: ${info.messageId}`)
    } catch (err) {
      smtpError = err instanceof Error ? err.message : String(err)
      console.error('[Contact Form SMTP Error]', smtpError)
      entry.deliveryStatus = 'smtp_failed'
    }
  } else {
    console.log('[Contact Form] No SMTP_USER / SMTP_PASS configured in environment. Saved to local inbox.')
  }
  console.log('----------------------------------------------------')

  return res.status(200).json({
    success: true,
    messageId: msgId,
    savedToLocal: saved,
    inboxPath: 'mywork/data/contact-inbox.json',
    mailDispatched,
    recipient,
    smtpError,
    gmailComposeUrl,
    mailtoUrl,
    entry,
    message: mailDispatched
      ? `Your message has been sent directly to ${recipient}.`
      : `Your message has been received and saved locally in mywork/data/contact-inbox.json.`,
  })
}
