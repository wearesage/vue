<template>
  <component class="icon" :is="map[icon]" />
</template>

<script lang="ts">
export type Icon =
  | "heart"
  | "share"
  | "comment"
  | "plus"
  | "check"
  | "undo"
  | "save"
  | "fork"
  | "shuffle"
  | "upload"
  | "card"
  | "download"
  | "lock"
  | "menu"
  | "alien"
  | "play"
  | "pause"
  | "surprise"
  | "grid"
  | "code"
  | "close"
  | "fullscreen"
  | "clone"
  | "print"
  | "restore"
  | "study"
  | "next"
  | "previous"
  | "microphone"
  | "fractal"
  | "settings"
  | "chevron-down"
  | "spotify"
  | "audius"
  | "radio-paradise"
  | "sound"
  | "globe"
  | "kexp"
  | "repost"
  | "eye"
  | "eye-open"
  | "eye-closed"
  | "radio"
  | "playlist"
  | "heart-outline"
  | "wand"
  | "album-artwork"
  | "edit"
  | "webcam"
  | "raw"
  | "json"
  | "shadertoy"
  | "buffer"
  | "touch"
  | "mouse"
  | "coffee"
  | "instagram"
  | "tiktok"
  | "audius-verified"
  | "twitter"
  | "phone"
  | "email"
  | "send"
  | "solana"
  | "audius"
  | "bitcoin"
  | "ethereum"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "keyboard"
  | "vinyl"
  | "discord"
  | "sliders"
  | "telegram"
  | "technology";
</script>

<script setup lang="ts">
import HeartIcon from "../../assets/icons/heart.svg";
import HeartOutlineIcon from "../../assets/icons/heart-outline.svg";
import ShareIcon from "../../assets/icons/share.svg";
import CommentIcon from "../../assets/icons/comment.svg";
import PlusIcon from "../../assets/icons/plus.svg";
import CheckIcon from "../../assets/icons/check.svg";
import UndoIcon from "../../assets/icons/undo.svg";
import SaveIcon from "../../assets/icons/save.svg";
import ForkIcon from "../../assets/icons/fork.svg";
import ShuffleIcon from "../../assets/icons/shuffle.svg";
import UploadIcon from "../../assets/icons/upload.svg";
import DownloadIcon from "../../assets/icons/download.svg";
import LockIcon from "../../assets/icons/lock.svg";
import MenuIcon from "../../assets/icons/menu.svg";
import PlayIcon from "../../assets/icons/play.svg";
import PauseIcon from "../../assets/icons/pause.svg";
import SurpriseIcon from "../../assets/icons/surprise.svg";
import GridIcon from "../../assets/icons/grid.svg";
import CodeIcon from "../../assets/icons/code.svg";
import CloseIcon from "../../assets/icons/close.svg";
import FullScreenIcon from "../../assets/icons/fullscreen.svg";
import CloneIcon from "../../assets/icons/clone.svg";
import PrintIcon from "../../assets/icons/print.svg";
import RestoreIcon from "../../assets/icons/restore.svg";
import StudyIcon from "../../assets/icons/study.svg";
import NextIcon from "../../assets/icons/next.svg";
import PreviousIcon from "../../assets/icons/previous.svg";
import MicrophoneIcon from "../../assets/icons/microphone.svg";
import FractalIcon from "../../assets/icons/fractal.svg";
import SettingsIcon from "../../assets/icons/settings.svg";
import ChevronLeftIcon from "../../assets/icons/chevron-left.svg";
import ChevronRightIcon from "../../assets/icons/chevron-right.svg";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg";
import SpotifyIcon from "../../assets/icons/spotify.svg";
import AudiusIcon from "../../assets/icons/audius.svg";
import AudiusVerifiedIcon from "../../assets/icons/audius-verified.svg";
import RadioParadiseIcon from "../../assets/icons/radio-paradise.svg";
import SoundIcon from "../../assets/icons/sound.svg";
import GlobeIcon from "../../assets/icons/globe.svg";
import KEXPIcon from "../../assets/icons/kexp.svg";
import RepostIcon from "../../assets/icons/repost.svg";
import EyeIcon from "../../assets/icons/eye.svg";
import EyeClosedIcon from "../../assets/icons/eye-closed.svg";
import EyeOpenIcon from "../../assets/icons/eye-open.svg";
import RadioIcon from "../../assets/icons/radio.svg";
import PlaylistIcon from "../../assets/icons/playlist.svg";
import WandIcon from "../../assets/icons/wand.svg";
import AlbumArtworkIcon from "../../assets/icons/album-artwork.svg";
import EditIcon from "../../assets/icons/edit.svg";
import WebcamIcon from "../../assets/icons/webcam.svg";
import RawIcon from "../../assets/icons/raw.svg";
import JSONIcon from "../../assets/icons/json.svg";
import ShaderToyIcon from "../../assets/icons/shadertoy.svg";
import BufferIcon from "../../assets/icons/buffer.svg";
import TouchIcon from "../../assets/icons/touch.svg";
import MouseIcon from "../../assets/icons/mouse.svg";
import CoffeeIcon from "../../assets/icons/coffee.svg";
import TwitterIcon from "../../assets/icons/x.svg";
import TikTokIcon from "../../assets/icons/tiktok.svg";
import InstagramIcon from "../../assets/icons/instagram.svg";
import PhoneIcon from "../../assets/icons/phone.svg";
import EmailIcon from "../../assets/icons/email.svg";
import SendIcon from "../../assets/icons/send.svg";
import BitcoinIcon from "../../assets/icons/bitcoin.svg";
import SolanaIcon from "../../assets/icons/solana.svg";
import EthereumIcon from "../../assets/icons/ethereum.svg";
import CardIcon from "../../assets/icons/card.svg";
import KeyboardIcon from "../../assets/icons/keyboard.svg";
import VinylIcon from "../../assets/icons/vinyl.svg";
import DiscordIcon from "../../assets/icons/discord.svg";
import TelegramIcon from "../../assets/icons/telegram.svg";
import SlidersIcon from "../../assets/icons/sliders.svg";
import TechnologyIcon from "../../assets/icons/technology.svg";
import AlienIcon from "../../assets/icons/alien.svg";

const map: Record<Icon, any> = {
  heart: HeartIcon,
  share: ShareIcon,
  comment: CommentIcon,
  plus: PlusIcon,
  check: CheckIcon,
  undo: UndoIcon,
  save: SaveIcon,
  fork: ForkIcon,
  shuffle: ShuffleIcon,
  upload: UploadIcon,
  download: DownloadIcon,
  lock: LockIcon,
  menu: MenuIcon,
  play: PlayIcon,
  pause: PauseIcon,
  surprise: SurpriseIcon,
  grid: GridIcon,
  code: CodeIcon,
  close: CloseIcon,
  fullscreen: FullScreenIcon,
  clone: CloneIcon,
  print: PrintIcon,
  restore: RestoreIcon,
  study: StudyIcon,
  next: NextIcon,
  previous: PreviousIcon,
  microphone: MicrophoneIcon,
  fractal: FractalIcon,
  settings: SettingsIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  spotify: SpotifyIcon,
  audius: AudiusIcon,
  "radio-paradise": RadioParadiseIcon,
  sound: SoundIcon,
  globe: GlobeIcon,
  kexp: KEXPIcon,
  repost: RepostIcon,
  eye: EyeIcon,
  "eye-closed": EyeClosedIcon,
  "eye-open": EyeOpenIcon,
  playlist: PlaylistIcon,
  radio: RadioIcon,
  "heart-outline": HeartOutlineIcon,
  wand: WandIcon,
  "album-artwork": AlbumArtworkIcon,
  edit: EditIcon,
  webcam: WebcamIcon,
  raw: RawIcon,
  json: JSONIcon,
  shadertoy: ShaderToyIcon,
  buffer: BufferIcon,
  touch: TouchIcon,
  mouse: MouseIcon,
  coffee: CoffeeIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  tiktok: TikTokIcon,
  "audius-verified": AudiusVerifiedIcon,
  email: EmailIcon,
  phone: PhoneIcon,
  send: SendIcon,
  solana: SolanaIcon,
  bitcoin: BitcoinIcon,
  ethereum: EthereumIcon,
  card: CardIcon,
  keyboard: KeyboardIcon,
  vinyl: VinylIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
  sliders: SlidersIcon,
  technology: TechnologyIcon,
  alien: AlienIcon
};

defineProps<{
  icon: Icon;
}>();
</script>

<style lang="scss" scoped>
svg {
  @include size(1rem);
  fill: white;
}
</style>
