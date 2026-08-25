export { cx } from "./lib/cx";
export { describeDevice } from "./lib/device";
export type { DeviceDescription } from "./lib/device";
export type { ClassValue } from "./lib/cx";
export {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDayLabel,
  formatDayMark,
  formatPeriod,
  formatTime,
  pluralize,
} from "./lib/format";

export { ThemeProvider, useTheme } from "./theme/ThemeProvider";
export type { ThemePreference, ResolvedTheme } from "./theme/ThemeProvider";
export { themeScript, THEME_STORAGE_KEY } from "./theme/theme-script";

export { Button, IconButton, buttonStyles } from "./components/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./components/Button";
export { Badge, Tag } from "./components/Badge";
export type { TagFamily } from "./components/Badge";
export type { Tone } from "./components/Badge";
export { Alert } from "./components/Alert";
export {
  Card,
  CardActions,
  CardBody,
  CardMeta,
  CardOverline,
  CardTitle,
} from "./components/Card";
export type { CardProps, CardVariant } from "./components/Card";
export {
  Checkbox,
  SelectField,
  TextAreaField,
  TextField,
} from "./components/Field";
export { EmptyState } from "./components/EmptyState";
export { Modal } from "./components/Modal";
export { Skeleton } from "./components/Skeleton";
export { Spinner } from "./components/Spinner";
export { TextureLayer } from "./components/TextureLayer";
export type { TextureVariant } from "./components/TextureLayer";
export { ThemeToggle } from "./components/ThemeToggle";
export { GoogleSignInButton } from "./components/GoogleSignInButton";
export { ToastProvider, useToast } from "./components/Toast";
export { Metadata, Overline, PageTitle, Prose } from "./components/Typography";
export { VisuallyHidden } from "./components/VisuallyHidden";
export { AIProvenance } from "./components/AIProvenance";
export type { ProvenanceCoverage } from "./components/AIProvenance";

/* ---- V2. Brand Book "Editorial Clinical Modernism". ---- */

export { Icon } from "./icons";
export type { IconName, IconSize, IconProps } from "./icons";

/* ---- Motion system. Ver MOTION.md. ---- */

export { gsap, Flip, useGSAP } from "./motion/gsap";
export {
  duration as motionDuration,
  ease as motionEase,
  distance as motionDistance,
  scale as motionScale,
  stagger as motionStagger,
  layer as motionLayer,
} from "./motion/tokens";
export type { MotionScale } from "./motion/tokens";
export {
  MOTION_QUERY,
  prefersReducedMotion,
  resolveMotionVariant,
  useReducedMotion,
} from "./motion/media";
export { useEnterOnMount } from "./motion/useEnterOnMount";
export { useActiveIndicator } from "./motion/useActiveIndicator";

export { AppFrame, EditorialGrid, FrameGutter } from "./components/shell/AppFrame";
export type { AppFrameProps } from "./components/shell/AppFrame";
export { MissingPage } from "./components/shell/MissingPage";
export type { MissingPageProps } from "./components/shell/MissingPage";
export { FolderStack } from "./components/shell/FolderStack";
export type {
  FolderDefinition,
  FolderStackProps,
} from "./components/shell/FolderStack";
export { FolderSheet } from "./components/shell/FolderSheet";
export type { FolderSheetProps, FolderTone } from "./components/shell/FolderSheet";
export { paperSurface, PAPER_TILE } from "./components/shell/FolderPaper";
export { folderPath, folderShape } from "./components/shell/folder-shape";
export { FolderDock, LocalNav } from "./components/shell/FolderDock";
export type { FolderDockItem, FolderDockProps } from "./components/shell/FolderDock";
export { DefaultNavLink } from "./components/shell/nav-link";
export type { NavLinkComponent } from "./components/shell/nav-link";
export { Masthead, SectionIndex, MetaStrip } from "./components/shell/Masthead";
export type { MastheadProps } from "./components/shell/Masthead";

export {
  ProvenanceBlock,
  ProvenanceLabel,
  SourceTrace,
} from "./components/editorial/Provenance";
export type { ProvenanceKind } from "./components/editorial/Provenance";
export { PaperPanel, PullQuote, StoryBlock } from "./components/editorial/StoryBlock";
export type { PanelFamily, StoryBlockProps } from "./components/editorial/StoryBlock";
export { RecurrenceBand, TimelineEvent, TimelineRail } from "./components/editorial/Timeline";
export type { TimelineMarker } from "./components/editorial/Timeline";
export { EditorialList, EditorialRow } from "./components/editorial/Row";
export type { EditorialRowProps } from "./components/editorial/Row";
export { BarStrip, ComparisonNote, StatBlock } from "./components/editorial/Data";
