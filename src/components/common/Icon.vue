<template>
  <component class="icon" :is="map[icon]" />
</template>

<script lang="ts">
export type Icon =
  | "add"
  | "album-artwork"
  | "alien"
  | "arrow-down"
  | "audius"
  | "audius-verified"
  | "back"
  | "bitcoin"
  | "browser"
  | "buffer"
  | "business"
  | "camera"
  | "card"
  | "cart"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "circle-arrow-left"
  | "circle-arrow-right"
  | "clients"
  | "clone"
  | "close"
  | "code"
  | "coffee"
  | "comment"
  | "data"
  | "delete"
  | "discord"
  | "download"
  | "drag"
  | "edit"
  | "email"
  | "ethereum"
  | "eye"
  | "eye-closed"
  | "eye-open"
  | "facebook"
  | "fork"
  | "forward"
  | "fractal"
  | "fullscreen"
  | "globe"
  | "grid"
  | "heart"
  | "heart-outline"
  | "home"
  | "instagram"
  | "invoice"
  | "json"
  | "kexp"
  | "keyboard"
  | "link"
  | "linkedin"
  | "lock"
  | "logout"
  | "manufacturing"
  | "menu"
  | "microphone"
  | "mouse"
  | "next"
  | "office"
  | "pause"
  | "phone"
  | "play"
  | "playlist"
  | "plus"
  | "previous"
  | "print"
  | "radio"
  | "radio-paradise"
  | "raw"
  | "repost"
  | "restore"
  | "save"
  | "search"
  | "send"
  | "settings"
  | "shadertoy"
  | "share"
  | "shuffle"
  | "sliders"
  | "solana"
  | "sound"
  | "space"
  | "spotify"
  | "study"
  | "surprise"
  | "technology"
  | "telegram"
  | "tiktok"
  | "touch"
  | "twitter"
  | "undo"
  | "upload"
  | "user"
  | "users"
  | "vinyl"
  | "visualizer"
  | "wand"
  | "webcam"
  | "x";
</script>

<script setup lang="ts">
import AddIcon from "../../assets/icons/add.svg";
import AlbumArtworkIcon from "../../assets/icons/album-artwork.svg";
import AlienIcon from "../../assets/icons/alien.svg";
import ArrowDownIcon from "../../assets/icons/arrow-down.svg";
import AudiusIcon from "../../assets/icons/audius.svg";
import AudiusVerifiedIcon from "../../assets/icons/audius-verified.svg";
import BackIcon from "../../assets/icons/back.svg";
import BitcoinIcon from "../../assets/icons/bitcoin.svg";
import BrowserIcon from "../../assets/icons/browser.svg";
import BufferIcon from "../../assets/icons/buffer.svg";
import BusinessIcon from "../../assets/icons/business.svg";
import CameraIcon from "../../assets/icons/camera.svg";
import CardIcon from "../../assets/icons/card.svg";
import CartIcon from "../../assets/icons/cart.svg";
import CheckIcon from "../../assets/icons/check.svg";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg";
import ChevronLeftIcon from "../../assets/icons/chevron-left.svg";
import ChevronRightIcon from "../../assets/icons/chevron-right.svg";
import ChevronUpIcon from "../../assets/icons/chevron-up.svg";
import CircleArrowLeftIcon from "../../assets/icons/circle-arrow-left.svg";
import CircleArrowRightIcon from "../../assets/icons/circle-arrow-right.svg";
import ClientsIcon from "../../assets/icons/clients.svg";
import CloneIcon from "../../assets/icons/clone.svg";
import CloseIcon from "../../assets/icons/close.svg";
import CodeIcon from "../../assets/icons/code.svg";
import CoffeeIcon from "../../assets/icons/coffee.svg";
import CommentIcon from "../../assets/icons/comment.svg";
import DataIcon from "../../assets/icons/data.svg";
import DeleteIcon from "../../assets/icons/delete.svg";
import DiscordIcon from "../../assets/icons/discord.svg";
import DownloadIcon from "../../assets/icons/download.svg";
import DragIcon from "../../assets/icons/drag.svg";
import EditIcon from "../../assets/icons/edit.svg";
import EmailIcon from "../../assets/icons/email.svg";
import EthereumIcon from "../../assets/icons/ethereum.svg";
import EyeIcon from "../../assets/icons/eye.svg";
import EyeClosedIcon from "../../assets/icons/eye-closed.svg";
import EyeOpenIcon from "../../assets/icons/eye-open.svg";
import FacebookIcon from "../../assets/icons/facebook.svg";
import ForkIcon from "../../assets/icons/fork.svg";
import ForwardIcon from "../../assets/icons/forward.svg";
import FractalIcon from "../../assets/icons/fractal.svg";
import FullScreenIcon from "../../assets/icons/fullscreen.svg";
import GlobeIcon from "../../assets/icons/globe.svg";
import GridIcon from "../../assets/icons/grid.svg";
import HeartIcon from "../../assets/icons/heart.svg";
import HeartOutlineIcon from "../../assets/icons/heart-outline.svg";
import HomeIcon from "../../assets/icons/home.svg";
import InstagramIcon from "../../assets/icons/instagram.svg";
import InvoiceIcon from "../../assets/icons/invoice.svg";
import JSONIcon from "../../assets/icons/json.svg";
import KEXPIcon from "../../assets/icons/kexp.svg";
import KeyboardIcon from "../../assets/icons/keyboard.svg";
import LinkIcon from "../../assets/icons/link.svg";
import LinkedInIcon from "../../assets/icons/linkedin.svg";
import LockIcon from "../../assets/icons/lock.svg";
import LogoutIcon from "../../assets/icons/logout.svg";
import ManufacturingIcon from "../../assets/icons/manufacturing.svg";
import MenuIcon from "../../assets/icons/menu.svg";
import MicrophoneIcon from "../../assets/icons/microphone.svg";
import MouseIcon from "../../assets/icons/mouse.svg";
import NextIcon from "../../assets/icons/next.svg";
import OfficeIcon from "../../assets/icons/office.svg";
import PauseIcon from "../../assets/icons/pause.svg";
import PhoneIcon from "../../assets/icons/phone.svg";
import PlayIcon from "../../assets/icons/play.svg";
import PlaylistIcon from "../../assets/icons/playlist.svg";
import PlusIcon from "../../assets/icons/plus.svg";
import PreviousIcon from "../../assets/icons/previous.svg";
import PrintIcon from "../../assets/icons/print.svg";
import RadioIcon from "../../assets/icons/radio.svg";
import RadioParadiseIcon from "../../assets/icons/radio-paradise.svg";
import RawIcon from "../../assets/icons/raw.svg";
import RepostIcon from "../../assets/icons/repost.svg";
import RestoreIcon from "../../assets/icons/restore.svg";
import SaveIcon from "../../assets/icons/save.svg";
import SearchIcon from "../../assets/icons/search.svg";
import SendIcon from "../../assets/icons/send.svg";
import SettingsIcon from "../../assets/icons/settings.svg";
import ShaderToyIcon from "../../assets/icons/shadertoy.svg";
import ShareIcon from "../../assets/icons/share.svg";
import ShuffleIcon from "../../assets/icons/shuffle.svg";
import SlidersIcon from "../../assets/icons/sliders.svg";
import SolanaIcon from "../../assets/icons/solana.svg";
import SoundIcon from "../../assets/icons/sound.svg";
import SpaceIcon from "../../assets/icons/space.svg";
import SpotifyIcon from "../../assets/icons/spotify.svg";
import StudyIcon from "../../assets/icons/study.svg";
import SurpriseIcon from "../../assets/icons/surprise.svg";
import TechnologyIcon from "../../assets/icons/technology.svg";
import TelegramIcon from "../../assets/icons/telegram.svg";
import TikTokIcon from "../../assets/icons/tiktok.svg";
import TouchIcon from "../../assets/icons/touch.svg";
import TwitterIcon from "../../assets/icons/x.svg";
import UndoIcon from "../../assets/icons/undo.svg";
import UploadIcon from "../../assets/icons/upload.svg";
import UserIcon from "../../assets/icons/user.svg";
import UsersIcon from "../../assets/icons/users.svg";
import VinylIcon from "../../assets/icons/vinyl.svg";
import VisualizerIcon from "../../assets/icons/visualizer.svg";
import WandIcon from "../../assets/icons/wand.svg";
import WebcamIcon from "../../assets/icons/webcam.svg";
import XIcon from "../../assets/icons/x.svg";

const map: Record<Icon, any> = {
  add: AddIcon,
  "album-artwork": AlbumArtworkIcon,
  alien: AlienIcon,
  "arrow-down": ArrowDownIcon,
  audius: AudiusIcon,
  "audius-verified": AudiusVerifiedIcon,
  back: BackIcon,
  bitcoin: BitcoinIcon,
  browser: BrowserIcon,
  buffer: BufferIcon,
  business: BusinessIcon,
  camera: CameraIcon,
  card: CardIcon,
  cart: CartIcon,
  check: CheckIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  "chevron-up": ChevronUpIcon,
  "circle-arrow-left": CircleArrowLeftIcon,
  "circle-arrow-right": CircleArrowRightIcon,
  clients: ClientsIcon,
  clone: CloneIcon,
  close: CloseIcon,
  code: CodeIcon,
  coffee: CoffeeIcon,
  comment: CommentIcon,
  data: DataIcon,
  delete: DeleteIcon,
  discord: DiscordIcon,
  download: DownloadIcon,
  drag: DragIcon,
  edit: EditIcon,
  email: EmailIcon,
  ethereum: EthereumIcon,
  eye: EyeIcon,
  "eye-closed": EyeClosedIcon,
  "eye-open": EyeOpenIcon,
  facebook: FacebookIcon,
  fork: ForkIcon,
  forward: ForwardIcon,
  fractal: FractalIcon,
  fullscreen: FullScreenIcon,
  globe: GlobeIcon,
  grid: GridIcon,
  heart: HeartIcon,
  "heart-outline": HeartOutlineIcon,
  home: HomeIcon,
  instagram: InstagramIcon,
  invoice: InvoiceIcon,
  json: JSONIcon,
  kexp: KEXPIcon,
  keyboard: KeyboardIcon,
  link: LinkIcon,
  linkedin: LinkedInIcon,
  lock: LockIcon,
  logout: LogoutIcon,
  manufacturing: ManufacturingIcon,
  menu: MenuIcon,
  microphone: MicrophoneIcon,
  mouse: MouseIcon,
  next: NextIcon,
  office: OfficeIcon,
  pause: PauseIcon,
  phone: PhoneIcon,
  play: PlayIcon,
  playlist: PlaylistIcon,
  plus: PlusIcon,
  previous: PreviousIcon,
  print: PrintIcon,
  radio: RadioIcon,
  "radio-paradise": RadioParadiseIcon,
  raw: RawIcon,
  repost: RepostIcon,
  restore: RestoreIcon,
  save: SaveIcon,
  search: SearchIcon,
  send: SendIcon,
  settings: SettingsIcon,
  shadertoy: ShaderToyIcon,
  share: ShareIcon,
  shuffle: ShuffleIcon,
  sliders: SlidersIcon,
  solana: SolanaIcon,
  sound: SoundIcon,
  space: SpaceIcon,
  spotify: SpotifyIcon,
  study: StudyIcon,
  surprise: SurpriseIcon,
  technology: TechnologyIcon,
  telegram: TelegramIcon,
  tiktok: TikTokIcon,
  touch: TouchIcon,
  twitter: TwitterIcon,
  undo: UndoIcon,
  upload: UploadIcon,
  user: UserIcon,
  users: UsersIcon,
  vinyl: VinylIcon,
  visualizer: VisualizerIcon,
  wand: WandIcon,
  webcam: WebcamIcon,
  x: XIcon
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
