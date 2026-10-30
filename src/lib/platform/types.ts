// Tipos de las respuestas de la API de cursos.

export interface AuthToken {
  token: string;
  expiry: string;
}

export interface User {
  id: number;
  created_at: string;
  name: string;
  email: string;
  activated: boolean;
}

export interface Course {
  id: number;
  slug: string;
  // Un producto es un curso en video o un ebook para descargar.
  kind: 'course' | 'ebook';
  title: string;
  subtitle?: string;
  description?: string;
  cover_url?: string;
  // Tráiler en Mux con reproducción pública: lo ve cualquiera en la página del curso.
  trailer_playback_id?: string;
  objectives?: string[];
  audience?: string[];
  prerequisites?: string;
  price_cents: number;
  presale_price_cents?: number;
  presale_until?: string;
  current_price_cents: number;
  lesson_count: number;
  total_duration_seconds: number;
}

export interface Lesson {
  id: number;
  slug: string;
  module_title?: string;
  title: string;
  summary?: string;
  position: number;
  duration_seconds: number;
  is_preview: boolean;
  resource_urls?: string[];
  // Texto de refuerzo en Markdown; solo viene en la página de la lección.
  content?: string;
}

// Material del curso, como el cuaderno de trabajo. La lista es pública; el archivo solo lo
// descargan los alumnos inscritos.
export interface CourseResource {
  slug: string;
  title: string;
  description?: string;
  // Extensión del archivo: "pdf", "docx"…
  format: string;
}

export interface LessonProgress {
  lesson_id: number;
  position_seconds: number;
  completed: boolean;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: number;
  created_at: string;
  user_id: number;
  course_id: number;
  amount_cents: number;
  method: 'yape' | 'plin' | 'culqi_card' | 'culqi_yape';
  operation_number: string;
  status: PaymentStatus;
  reject_reason?: string;
  reviewed_at?: string;
  version: number;
}

export interface Viewer {
  enrolled: boolean;
  completed_lessons: number;
  course_completed: boolean;
  next_lesson_slug?: string;
  progress?: LessonProgress[];
  latest_payment?: Payment;
}

export interface CoursePage {
  course: Course;
  lessons: Lesson[];
  resources?: CourseResource[];
  viewer?: Viewer;
}

export interface Playback {
  playback_id: string;
  video: string;
  thumbnail: string;
  storyboard: string;
  expires_at: string;
}

export interface LessonPage {
  course_slug: string;
  lesson: Lesson;
  position: number;
  total: number;
  previous_lesson_slug?: string;
  next_lesson_slug?: string;
  playback?: Playback;
  progress?: LessonProgress;
}

export interface MyCourse extends Course {
  completed_lessons: number;
  course_completed: boolean;
  next_lesson_slug?: string;
}

export interface MyPayment extends Payment {
  course_slug?: string;
  course_title?: string;
}

export interface Me {
  user: User;
  is_admin: boolean;
  courses: MyCourse[];
  payments: MyPayment[];
}

export interface AdminPayment extends Payment {
  user_name: string;
  user_email: string;
  course_title: string;
}

export interface Metadata {
  current_page?: number;
  page_size?: number;
  first_page?: number;
  last_page?: number;
  total_records?: number;
}

export interface Subscriber {
  id: number;
  created_at: string;
  email: string;
  name?: string;
  wants_whatsapp: boolean;
  sources: string[];
  status: 'active' | 'unsubscribed';
  unsubscribed_at?: string;
  version: number;
}

export interface SubscriberStats {
  total: number;
  active: number;
  new_this_month: number;
  by_source: Record<string, number>;
}

export interface Complaint {
  id: number;
  number: string;
  created_at: string;
  kind: 'reclamo' | 'queja';
  consumer_name: string;
  consumer_document_type: string;
  consumer_document_number: string;
  consumer_address: string;
  consumer_phone?: string;
  consumer_email: string;
  guardian_name?: string;
  item_type: 'producto' | 'servicio';
  item_description: string;
  amount_cents?: number;
  detail: string;
  request: string;
  status: 'pending' | 'answered';
  response?: string;
  responded_at?: string;
  version: number;
}
