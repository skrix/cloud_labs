variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "iot-hub"
}

variable "github_repo" {
  type = string
}

variable "budget_email" {
  type = string
}

variable "app_path" {
  type    = string
  default = "../../.."
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "autoscaling_min" {
  type    = number
  default = 1
}

variable "autoscaling_max" {
  type    = number
  default = 4
}

variable "autoscaling_cpu_target" {
  description = "Target average CPU utilization of the API service, %"
  type        = number
  default     = 70
}

variable "autoscaling_scale_out_cooldown" {
  description = "Seconds after a scale-out before another scale-out may build on it"
  type        = number
  default     = 60
}

variable "autoscaling_scale_in_cooldown" {
  description = "Seconds after a scaling activity before the next scale-in"
  type        = number
  default     = 300
}

variable "alert_latency_p95_ms" {
  description = "Overload alert: API p95 latency threshold, ms"
  type        = number
  default     = 500
}

variable "alert_latency_minutes" {
  description = "Overload alert: consecutive minutes above the threshold before the alert fires"
  type        = number
  default     = 2
}

variable "cache_enabled" {
  description = "Cache-aside for readings stats in Redis (false: every read goes to the database)"
  type        = bool
  default     = true
}

variable "cache_ttl_seconds" {
  description = "How long a cached readings stats response stays fresh, s"
  type        = number
  default     = 60

  validation {
    condition     = var.cache_ttl_seconds >= 30 && var.cache_ttl_seconds <= 60
    error_message = "cache_ttl_seconds must be 30-60"
  }
}

variable "ingest_queue_enabled" {
  description = "POST /ingest queues readings for the worker (202) instead of storing them (201)"
  type        = bool
  default     = true
}

variable "worker_min" {
  type    = number
  default = 1
}

variable "worker_max" {
  type    = number
  default = 4
}

variable "worker_backlog_per_task" {
  description = "Target queued messages per worker task for autoscaling"
  type        = number
  default     = 100
}

variable "schedule_enabled" {
  description = "Different minimum task counts for day and night (schedule.tf)"
  type        = bool
  default     = true
}

variable "schedule_timezone" {
  type    = string
  default = "Europe/Kyiv"
}

variable "schedule_day_cron" {
  description = "When the day minimums start"
  type        = string
  default     = "cron(0 8 * * ? *)"
}

variable "schedule_night_cron" {
  description = "When the night minimums start"
  type        = string
  default     = "cron(0 22 * * ? *)"
}

variable "api_day_min" {
  description = "Minimum API tasks during the day (night: autoscaling_min)"
  type        = number
  default     = 2
}
