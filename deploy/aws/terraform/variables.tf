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
