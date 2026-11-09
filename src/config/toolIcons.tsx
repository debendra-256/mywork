import { Bot, Download, Droplets, Eraser, FileArchive, IdCard, ImagePlus, Images, Instagram, Layers, MessageCircle, MonitorPlay, Network, Palette, PanelLeft, QrCode, ScanLine, Smile, Sparkles, Video, Wand2, Youtube, Zap } from 'lucide-react'
import type { ToolIcon } from './ToolsConfig'

const toolGlyphs: Record<ToolIcon, typeof Images> = {
  images: Images,
  youtube: Youtube,
  'image-plus': ImagePlus,
  video: Video,
  'qr-code': QrCode,
  download: Download,
  scan: ScanLine,
  layers: Layers,
  message: MessageCircle,
  network: Network,
  eraser: Eraser,
  droplets: Droplets,
  sparkles: Sparkles,
  wand: Wand2,
  bot: Bot,
  'monitor-play': MonitorPlay,
  zap: Zap,
  instagram: Instagram,
  smile: Smile,
  palette: Palette,
  'panel-left': PanelLeft,
  'id-card': IdCard,
  'file-archive': FileArchive,
}

/** Draws the lucide glyph registered for a tool icon key. */
export function ToolGlyph({ icon, size = 17 }: { icon: ToolIcon; size?: number }) {
  const Glyph = toolGlyphs[icon]
  return <Glyph size={size} />
}

/** Every icon a tool entry may use — also what the admin tool picker offers. */
export const toolIconNames: readonly ToolIcon[] = Object.keys(toolGlyphs) as ToolIcon[]
